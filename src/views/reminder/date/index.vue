<template>
  <div class="app-container">
    <!-- 当前日期信息卡片 -->
    <div class="dashboard-container">
      <!-- 左侧：今日信息 -->
      <div class="today-info-card">
        <div class="card-header">
          <div class="header-left">
            <span class="header-icon">📅</span>
            <span class="header-title">今日信息</span>
          </div>
          <el-button class="calendar-btn" type="text" @click="showCalendar = true">
            <i class="el-icon-date"></i> 日历
          </el-button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-icon">📆</div>
            <div class="info-content">
              <div class="info-label">公历</div>
              <div class="info-value">{{ solarDate }}</div>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon">🌙</div>
            <div class="info-content">
              <div class="info-label">农历</div>
              <div class="info-value lunar">{{ lunarDate }}</div>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon">📅</div>
            <div class="info-content">
              <div class="info-label">星期</div>
              <div class="info-value">{{ weekDay }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：时钟 -->
      <div class="clock-card">
        <div class="clock-wrapper">
          <div class="clock-time">
            <span class="time-digit">{{ hours }}</span>
            <span class="time-separator">:</span>
            <span class="time-digit">{{ minutes }}</span>
            <span class="time-separator">:</span>
            <span class="time-digit">{{ seconds }}</span>
          </div>
          <div class="clock-date">{{ fullDate }}</div>
        </div>
      </div>
    </div>

    <!-- 日历弹窗 -->
    <el-dialog :visible.sync="showCalendar" width="750px" append-to-body class="calendar-dialog">
      <template slot="title">
        <div class="dialog-title">
          <i class="el-icon-date"></i>
          <span>日历</span>
        </div>
      </template>
      <el-calendar v-model="calendarValue" class="custom-calendar">
        <template slot="dateCell" slot-scope="{ date, data }">
          <el-tooltip
            :content="getTooltipContent(date)"
            :disabled="!getHolidayInfo(date) && !isLegalHoliday(date)"
            placement="top"
            effect="light"
          >
            <div
              class="calendar-cell"
              :class="{
                'is-today': isToday(date),
                'is-holiday': getHolidayInfo(date),
                'is-legal-holiday': isLegalHoliday(date),
                'is-makeup-work': isMakeupWorkDay(date)
              }"
            >
              <div class="solar-day">{{ data.day.split('-')[2] - 0 }}</div>
              <div class="lunar-day" :class="{ 'holiday-text': getHolidayInfo(date) || isLegalHoliday(date) }">
                {{ isLegalHoliday(date) || getHolidayInfo(date) || getLunarDayForDate(date) }}
              </div>
            </div>
          </el-tooltip>
        </template>
      </el-calendar>
    </el-dialog>

    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="类型" prop="dateType">
        <el-select v-model="queryParams.dateType" placeholder="请选择类型" clearable>
          <el-option label="生日" :value="1" />
          <el-option label="纪念日" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['reminder:date:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['reminder:date:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['reminder:date:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="dateList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="标题" align="center" prop="title" :show-overflow-tooltip="true" />
      <el-table-column label="类型" align="center" prop="dateType" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.dateType === 1" type="danger">生日</el-tag>
          <el-tag v-else-if="scope.row.dateType === 2" type="warning">纪念日</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="农历日期" align="center" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.isLunar === 1" class="lunar">{{ getLunarDate(scope.row.dateValue) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="公历日期" align="center" width="120">
        <template slot-scope="scope">
          <span>{{ getDisplayDate(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="重复" align="center" prop="repeatType" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.repeatType === 1">每年</span>
          <span v-else-if="scope.row.repeatType === 2">每月</span>
          <span v-else>不重复</span>
        </template>
      </el-table-column>
      <el-table-column label="倒计时" align="center" width="120">
        <template slot-scope="scope">
          <el-tag :type="getCountdownType(scope.row)" size="small">
            {{ getCountdown(scope.row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提前提醒" align="center" prop="remindDaysBefore" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.remindDaysBefore }} 天</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="isEnabled" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.isEnabled === 1" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['reminder:date:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['reminder:date:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="如：女朋友生日、结婚纪念日" />
        </el-form-item>
        <el-form-item label="类型" prop="dateType">
          <el-select v-model="form.dateType" placeholder="请选择类型" style="width: 100%" @change="handleTypeChange">
            <el-option label="生日" :value="1" />
            <el-option label="纪念日" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期类型">
          <el-tag v-if="form.dateType === 1" type="success">农历（生日自动使用农历）</el-tag>
          <el-tag v-else-if="form.dateType === 2" type="info">公历（纪念日使用公历）</el-tag>
          <span v-else style="color: #909399;">请先选择类型</span>
        </el-form-item>
        <!-- 农历日期选择 -->
        <template v-if="form.isLunar === 1">
          <el-form-item label="农历日期" required>
            <el-col :span="11">
              <el-form-item prop="lunarMonth">
                <el-select v-model="form.lunarMonth" placeholder="选择月份" style="width: 100%">
                  <el-option v-for="m in 12" :key="m" :label="getLunarMonthLabel(m)" :value="m" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col class="line" :span="2" style="text-align: center">-</el-col>
            <el-col :span="11">
              <el-form-item prop="lunarDay">
                <el-select v-model="form.lunarDay" placeholder="选择日期" style="width: 100%">
                  <el-option v-for="d in 30" :key="d" :label="getLunarDayLabel(d)" :value="d" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-form-item>
          <el-form-item label="今年公历">
            <el-input :value="computedSolarDate" disabled placeholder="自动计算">
              <template slot="prefix"><i class="el-icon-date"></i></template>
            </el-input>
          </el-form-item>
        </template>
        <!-- 公历日期选择 -->
        <template v-else>
          <el-form-item label="公历日期" prop="dateValue">
            <el-date-picker
              v-model="form.dateValue"
              type="date"
              placeholder="选择日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
            />
          </el-form-item>
        </template>
        <el-form-item label="重复方式" prop="repeatType">
          <el-radio-group v-model="form.repeatType">
            <el-radio :label="1">每年</el-radio>
            <el-radio :label="2">每月</el-radio>
            <el-radio :label="3">不重复</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提前提醒" prop="remindDaysBefore">
          <el-input-number v-model="form.remindDaysBefore" :min="0" :max="30" /> 天
        </el-form-item>
        <el-form-item label="提醒时间" prop="remindTime">
          <el-time-picker
            v-model="form.remindTime"
            placeholder="选择提醒时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="isEnabled">
          <el-radio-group v-model="form.isEnabled">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDate, getDate, addDate, updateDate, delDate } from "@/api/reminder/importantDate";

// 农历转换工具
const LunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520
];

// 中国重要节假日（公历固定日期）
const SolarHolidays = {
  '1-1': '元旦',
  '3-8': '妇女节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '10-1': '国庆节',
  '12-25': '圣诞节'
};

// 中国重要节假日（农历固定日期）
const LunarHolidays = {
  '1-1': '春节',
  '1-15': '元宵节',
  '5-5': '端午节',
  '7-7': '七夕',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-30': '除夕'
};

// 法定休息日（公历日期范围）
const LegalHolidays = [
  { name: '元旦', start: '1-1', end: '1-1' },
  { name: '春节', start: '1-21', end: '1-27', lunar: true, lunarStart: '1-1', lunarEnd: '1-7' },
  { name: '清明节', start: '4-4', end: '4-6' },
  { name: '劳动节', start: '5-1', end: '5-5' },
  { name: '端午节', start: '6-22', end: '6-24', lunar: true, lunarStart: '5-5', lunarEnd: '5-5' },
  { name: '中秋节', start: '9-29', end: '10-1', lunar: true, lunarStart: '8-15', lunarEnd: '8-15' },
  { name: '国庆节', start: '10-1', end: '10-7' }
];

// 补班日期（2024-2026年）
const MakeupWorkDays = {
  '2024': ['1-20', '1-28', '2-4', '2-18', '4-7', '4-28', '5-11', '9-14', '9-29', '10-12'],
  '2025': ['1-26', '2-8', '4-27', '5-10', '9-28', '10-11'],
  '2026': ['1-25', '2-14', '4-26', '5-9', '9-27', '10-10']
};

const Tianan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const Dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const Shengxiao = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const MonthCN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const DayCN1 = ['初', '十', '廿', '三十'];
const DayCN2 = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function lYearDays(y) {
  let i, sum = 348;
  for (i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LunarInfo[y - 1900] & i) ? 1 : 0;
  }
  return sum + leapDays(y);
}

function leapMonth(y) {
  return LunarInfo[y - 1900] & 0xf;
}

function leapDays(y) {
  if (leapMonth(y)) {
    return (LunarInfo[y - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function monthDays(y, m) {
  return (LunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

/**
 * 农历转公历
 * @param {number} lunarYear 农历年
 * @param {number} lunarMonth 农历月 (1-12)
 * @param {number} lunarDay 农历日 (1-30)
 * @param {boolean} isLeapMonth 是否闰月
 * @returns {{ year: number, month: number, day: number }}
 */
function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth) {
  const baseTime = Date.UTC(1900, 0, 31); // 农历1900年正月初一（UTC避免时区偏移）
  let offset = 0;

  // 计算从1900年到lunarYear-1年的总天数
  for (let y = 1900; y < lunarYear; y++) {
    offset += lYearDays(y);
  }

  // 计算当年从正月到lunarMonth-1月的天数
  const leap = leapMonth(lunarYear);
  for (let m = 1; m < lunarMonth; m++) {
    offset += monthDays(lunarYear, m);
    // 闰月在对应月之后
    if (leap > 0 && m === leap) {
      offset += leapDays(lunarYear);
    }
  }

  // 如果指定了闰月，再加上闰月的天数
  if (isLeapMonth && leap === lunarMonth) {
    offset += monthDays(lunarYear, lunarMonth);
  }

  // 加上日期天数（减1因为初一=1天）
  offset += lunarDay - 1;

  // 用UTC计算公历日期，避免时区问题
  const resultTime = baseTime + offset * 86400000;
  const resultDate = new Date(resultTime);
  return {
    year: resultDate.getUTCFullYear(),
    month: resultDate.getUTCMonth() + 1,
    day: resultDate.getUTCDate()
  };
}

function solarToLunar(solarYear, solarMonth, solarDay) {
  const baseDate = new Date(1900, 0, 31);
  const objDate = new Date(solarYear, solarMonth - 1, solarDay);
  let offset = Math.floor((objDate - baseDate) / 86400000);

  let lunarYear, lunarMonth, lunarDay;
  let isLeap = false;

  let temp = 0;
  for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
    temp = lYearDays(lunarYear);
    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    lunarYear--;
  }

  const leap = leapMonth(lunarYear);
  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
      --lunarMonth;
      isLeap = true;
      temp = leapDays(lunarYear);
    } else {
      temp = monthDays(lunarYear, lunarMonth);
    }

    if (isLeap && lunarMonth === (leap + 1)) {
      isLeap = false;
    }

    offset -= temp;
  }

  if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --lunarMonth;
    }
  }

  if (offset < 0) {
    offset += temp;
    --lunarMonth;
  }

  lunarDay = offset + 1;

  const ganIndex = (lunarYear - 4) % 10;
  const zhiIndex = (lunarYear - 4) % 12;
  const shengxiaoIndex = (lunarYear - 4) % 12;

  const dayStr1 = DayCN1[Math.floor(lunarDay / 10)];
  const dayStr2 = DayCN2[lunarDay % 10];
  const dayStr = lunarDay === 10 ? '初十' : (lunarDay === 20 ? '二十' : (lunarDay === 30 ? '三十' : dayStr1 + dayStr2));

  return {
    lunarYear: lunarYear,
    lunarMonth: lunarMonth,
    lunarDay: lunarDay,
    isLeap: isLeap,
    monthStr: (isLeap ? '闰' : '') + MonthCN[lunarMonth - 1] + '月',
    dayStr: dayStr,
    ganZhi: Tianan[ganIndex] + Dizhi[zhiIndex],
    shengxiao: Shengxiao[shengxiaoIndex]
  };
}

export default {
  name: "ImportantDate",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 重要日期表格数据
      dateList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 当前日期信息
      solarDate: '',
      lunarDate: '',
      weekDay: '',
      hours: '00',
      minutes: '00',
      seconds: '00',
      fullDate: '',
      clockTimer: null,
      // 日历相关
      showCalendar: false,
      calendarValue: new Date(),
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        dateType: null
      },
      // 表单参数
      form: {
        lunarMonth: null,
        lunarDay: null
      },
      // 表单校验
      rules: {
        title: [
          { required: true, message: "标题不能为空", trigger: "blur" }
        ],
        dateType: [
          { required: true, message: "类型不能为空", trigger: "change" }
        ],
        dateValue: [
          { required: true, message: "日期不能为空", trigger: "change" }
        ],
        lunarMonth: [
          { required: true, message: "请选择农历月份", trigger: "change" }
        ],
        lunarDay: [
          { required: true, message: "请选择农历日期", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.initCurrentDate();
    this.startClock();
  },
  beforeDestroy() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  },
  computed: {
    /** 计算今年农历对应的公历日期 */
    computedSolarDate() {
      if (this.form.isLunar === 1 && this.form.lunarMonth && this.form.lunarDay) {
        const currentYear = new Date().getFullYear();
        const solar = lunarToSolar(currentYear, this.form.lunarMonth, this.form.lunarDay, false);
        return `${solar.year}年${solar.month}月${solar.day}日`;
      }
      return '';
    }
  },
  methods: {
    /** 初始化当前日期信息 */
    initCurrentDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      this.solarDate = `${year}年${month}月${day}日`;

      const lunar = solarToLunar(year, month, day);
      this.lunarDate = `${lunar.ganZhi}${lunar.shengxiao}年 ${lunar.monthStr}${lunar.dayStr}`;

      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      this.weekDay = weekDays[now.getDay()];
    },
    /** 启动时钟 */
    startClock() {
      this.updateTime();
      this.clockTimer = setInterval(() => {
        this.updateTime();
      }, 1000);
    },
    /** 更新时间 */
    updateTime() {
      const now = new Date();
      this.hours = String(now.getHours()).padStart(2, '0');
      this.minutes = String(now.getMinutes()).padStart(2, '0');
      this.seconds = String(now.getSeconds()).padStart(2, '0');
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      this.fullDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
    },
    /** 判断是否是今天 */
    isToday(date) {
      const today = new Date();
      const d = new Date(date);
      return today.toDateString() === d.toDateString();
    },
    /** 获取提示内容 */
    getTooltipContent(date) {
      const holiday = this.getHolidayInfo(date);
      const legal = this.isLegalHoliday(date);
      const makeup = this.isMakeupWorkDay(date);
      const parts = [];
      if (holiday) parts.push(holiday);
      if (legal) parts.push(legal);
      if (makeup) parts.push(makeup);
      return parts.join(' | ') || '';
    },
    /** 判断是否是补班日 */
    isMakeupWorkDay(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const key = `${month}-${day}`;

      const yearMakeupDays = MakeupWorkDays[year.toString()];
      if (yearMakeupDays && yearMakeupDays.includes(key)) {
        return '补班';
      }
      return null;
    },
    /** 获取节假日信息 */
    getHolidayInfo(date) {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();

      // 检查公历节假日
      const solarKey = `${month}-${day}`;
      if (SolarHolidays[solarKey]) {
        return SolarHolidays[solarKey];
      }

      // 检查农历节假日
      const lunar = solarToLunar(d.getFullYear(), month, day);
      const lunarKey = `${lunar.lunarMonth}-${lunar.lunarDay}`;
      if (LunarHolidays[lunarKey]) {
        return LunarHolidays[lunarKey];
      }

      return null;
    },
    /** 判断是否是法定休息日 */
    isLegalHoliday(date) {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const lunar = solarToLunar(d.getFullYear(), month, day);

      for (const holiday of LegalHolidays) {
        if (holiday.lunar) {
          // 农历节日：检查农历日期范围
          const lunarMonth = lunar.lunarMonth;
          const lunarDay = lunar.lunarDay;
          const [startMonth, startDay] = holiday.lunarStart.split('-').map(Number);
          const [endMonth, endDay] = holiday.lunarEnd.split('-').map(Number);

          // 简化判断：同月内判断
          if (lunarMonth === startMonth && lunarMonth === endMonth) {
            if (lunarDay >= startDay && lunarDay <= endDay) {
              return holiday.name + '假期';
            }
          } else if (lunarMonth === startMonth && lunarDay >= startDay) {
            return holiday.name + '假期';
          } else if (lunarMonth === endMonth && lunarDay <= endDay) {
            return holiday.name + '假期';
          }
        } else {
          // 公历节日：检查公历日期范围
          const [startMonth, startDay] = holiday.start.split('-').map(Number);
          const [endMonth, endDay] = holiday.end.split('-').map(Number);

          if (month === startMonth && month === endMonth) {
            if (day >= startDay && day <= endDay) {
              return holiday.name + '假期';
            }
          } else if (month === startMonth && day >= startDay) {
            return holiday.name + '假期';
          } else if (month === endMonth && day <= endDay) {
            return holiday.name + '假期';
          }
        }
      }

      return null;
    },
    /** 获取指定日期的农历日 */
    getLunarDayForDate(date) {
      const d = new Date(date);
      const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return lunar.dayStr;
    },
    /** 获取农历日期 */
    getLunarDate(date) {
      if (!date) return '';
      const d = new Date(date);
      const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return `${lunar.monthStr}${lunar.dayStr}`;
    },
    /** 获取今年对应的公历日期 */
    getThisYearSolarDate(row) {
      if (!row.dateValue) return '-';
      const d = new Date(row.dateValue);
      const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const currentYear = new Date().getFullYear();
      const solar = lunarToSolar(currentYear, lunar.lunarMonth, lunar.lunarDay, false);
      return `${solar.month}月${solar.day}日`;
    },
    /** 获取显示日期（统一格式） */
    getDisplayDate(row) {
      if (!row.dateValue) return '-';
      if (row.isLunar === 1) {
        // 农历：显示今年对应的公历
        return this.getThisYearSolarDate(row);
      } else {
        // 公历：显示为 X月X日 格式
        const d = new Date(row.dateValue);
        return `${d.getMonth() + 1}月${d.getDate()}日`;
      }
    },
    /** 获取农历月份标签 */
    getLunarMonthLabel(month) {
      const MonthCN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
      return MonthCN[month - 1] + '月';
    },
    /** 获取农历日期标签 */
    getLunarDayLabel(day) {
      const DayCN1 = ['初', '十', '廿', '三十'];
      const DayCN2 = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      const dayStr1 = DayCN1[Math.floor(day / 10)];
      const dayStr2 = DayCN2[day % 10];
      return day === 10 ? '初十' : (day === 20 ? '二十' : (day === 30 ? '三十' : dayStr1 + dayStr2));
    },
    /** 类型切换 */
    handleTypeChange(val) {
      if (val === 1) {
        // 生日：自动设置为农历
        this.form.isLunar = 1;
        this.form.dateValue = null;
      } else if (val === 2) {
        // 纪念日：自动设置为公历
        this.form.isLunar = 0;
        this.form.lunarMonth = null;
        this.form.lunarDay = null;
      }
    },
    /** 获取倒计时 */
    getCountdown(row) {
      if (!row.dateValue) return '-';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let nextDate;

      if (row.isLunar === 1) {
        // 农历日期：从存储的公历日期还原农历月日，再算今年对应的公历日期
        const d = new Date(row.dateValue);
        const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const thisYearSolar = lunarToSolar(today.getFullYear(), lunar.lunarMonth, lunar.lunarDay, false);
        nextDate = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
        // 如果今年的农历生日已过，算明年的
        if (nextDate < today) {
          const nextYearSolar = lunarToSolar(today.getFullYear() + 1, lunar.lunarMonth, lunar.lunarDay, false);
          nextDate = new Date(nextYearSolar.year, nextYearSolar.month - 1, nextYearSolar.day);
        }
      } else {
        // 公历日期：直接用月日
        const date = new Date(row.dateValue);
        nextDate = new Date(date);
        nextDate.setFullYear(today.getFullYear());
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate < today) {
          nextDate.setFullYear(today.getFullYear() + 1);
        }
      }

      const diff = nextDate.getTime() - today.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return '今天';
      } else if (days === 1) {
        return '明天';
      } else if (days === 2) {
        return '后天';
      } else {
        return days + '天';
      }
    },
    /** 获取倒计时标签类型 */
    getCountdownType(row) {
      const countdown = this.getCountdown(row);
      if (countdown === '今天') return 'danger';
      if (countdown === '明天' || countdown === '后天') return 'warning';
      const days = parseInt(countdown);
      if (days <= 7) return 'warning';
      return 'success';
    },
    /** 查询重要日期列表 */
    getList() {
      this.loading = true;
      listDate(this.queryParams).then(response => {
        this.dateList = response.rows;
        this.total = response.total;
        // 按倒计时升序排序
        this.dateList.sort((a, b) => {
          const daysA = this.calculateDays(a);
          const daysB = this.calculateDays(b);
          return daysA - daysB;
        });
        this.loading = false;
      });
    },
    /** 计算倒计时天数（用于排序） */
    calculateDays(row) {
      if (!row.dateValue) return 9999;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let nextDate;
      if (row.isLunar === 1) {
        const d = new Date(row.dateValue);
        const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const thisYearSolar = lunarToSolar(today.getFullYear(), lunar.lunarMonth, lunar.lunarDay, false);
        nextDate = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
        if (nextDate < today) {
          const nextYearSolar = lunarToSolar(today.getFullYear() + 1, lunar.lunarMonth, lunar.lunarDay, false);
          nextDate = new Date(nextYearSolar.year, nextYearSolar.month - 1, nextYearSolar.day);
        }
      } else {
        const date = new Date(row.dateValue);
        nextDate = new Date(date);
        nextDate.setFullYear(today.getFullYear());
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate < today) {
          nextDate.setFullYear(today.getFullYear() + 1);
        }
      }
      return Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        title: null,
        dateType: 1, // 默认生日
        dateValue: null,
        lunarMonth: null,
        lunarDay: null,
        repeatType: 1,
        remindDaysBefore: 3,
        remindTime: '09:00',
        isLunar: 1, // 生日默认农历
        isEnabled: 1,
        remark: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length != 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增重要日期";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getDate(id).then(response => {
        this.form = response.data;
        // 如果是农历日期，将存储的公历日期转回农历显示
        if (this.form.isLunar === 1 && this.form.dateValue) {
          const d = new Date(this.form.dateValue);
          const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
          this.form.lunarMonth = lunar.lunarMonth;
          this.form.lunarDay = lunar.lunarDay;
        }
        this.open = true;
        this.title = "修改重要日期";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const submitData = { ...this.form };
          if (submitData.isLunar === 1) {
            // 农历模式：使用农历月日，计算今年对应的公历日期存储
            if (!submitData.lunarMonth || !submitData.lunarDay) {
              this.$modal.msgError("请选择农历日期");
              return;
            }
            const currentYear = new Date().getFullYear();
            const solar = lunarToSolar(currentYear, submitData.lunarMonth, submitData.lunarDay, false);
            submitData.dateValue = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`;
          }
          // 清理不需要的字段
          delete submitData.lunarMonth;
          delete submitData.lunarDay;

          if (submitData.id != null) {
            updateDate(submitData).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDate(submitData).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除重要日期编号为"' + ids + '"的数据项？').then(function() {
        return delDate(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
/* 仪表盘容器 */
.dashboard-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

/* 今日信息卡片 */
.today-info-card {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 24px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
}

.calendar-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 14px;
  padding: 8px 16px !important;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.calendar-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-2px);
}

.info-grid {
  display: flex;
  gap: 20px;
}

.info-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-3px);
}

.info-icon {
  font-size: 28px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.info-value.lunar {
  color: #ffd700;
}

/* 时钟卡片 */
.clock-card {
  width: 320px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(26, 26, 46, 0.4);
  overflow: hidden;
  position: relative;
}

.clock-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.clock-wrapper {
  text-align: center;
  position: relative;
  z-index: 1;
}

.clock-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.time-digit {
  font-size: 52px;
  font-weight: 700;
  color: #fff;
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  background: linear-gradient(180deg, #fff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
  min-width: 70px;
}

.time-separator {
  font-size: 48px;
  color: #667eea;
  font-weight: 300;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.clock-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2px;
}

/* 日历弹窗样式 */
.calendar-dialog >>> .el-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.calendar-dialog >>> .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  margin: 0;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.calendar-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 20px;
}

.calendar-dialog >>> .el-dialog__body {
  padding: 20px;
}

.custom-calendar {
  border: none;
  border-radius: 12px;
  max-height: 450px;
  overflow: hidden;
}

.custom-calendar >>> .el-calendar-table .el-calendar-day {
  height: auto;
  padding: 0;
}

.custom-calendar >>> .el-calendar__header {
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
  padding-top: 10px;
}

.custom-calendar >>> .el-calendar__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.custom-calendar >>> .el-calendar-table thead th {
  color: #667eea;
  font-weight: 600;
  font-size: 14px;
}

.custom-calendar >>> .el-calendar-table td {
  border: 1px solid #f5f5f5;
  transition: all 0.3s ease;
  padding: 0;
  min-width: 80px;
}

/* 上个月和下个月的日期样式 */
.custom-calendar >>> .el-calendar-table td.prev,
.custom-calendar >>> .el-calendar-table td.next {
  background-color: #fafafa;
}

.custom-calendar >>> .el-calendar-table td.prev .solar-day,
.custom-calendar >>> .el-calendar-table td.next .solar-day {
  color: #c0c4cc;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-calendar >>> .el-calendar-table td.prev .lunar-day,
.custom-calendar >>> .el-calendar-table td.next .lunar-day {
  color: #dcdfe6;
}

.custom-calendar >>> .el-calendar-table td:hover {
  background: #f5f7ff;
}

.custom-calendar >>> .el-calendar-table .is-today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.custom-calendar >>> .el-calendar-table .is-today .solar-day {
  color: white;
  font-weight: 700;
}

.custom-calendar >>> .el-calendar-table .is-today .lunar-day {
  color: rgba(255, 255, 255, 0.9);
}

/* 节假日样式 */
.custom-calendar >>> .el-calendar-table .is-holiday {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.custom-calendar >>> .el-calendar-table .is-holiday:hover {
  background: linear-gradient(135deg, #ffe0e0 0%, #ffd0d0 100%);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.15);
}

.custom-calendar >>> .el-calendar-table .is-holiday .solar-day {
  color: #f56c6c;
  font-weight: 700;
}

.custom-calendar >>> .el-calendar-table .is-holiday .lunar-day {
  color: #f56c6c;
  font-weight: 600;
}

.holiday-text {
  color: #f56c6c !important;
  font-weight: 600;
  font-size: 11px;
}

/* 法定休息日样式 */
.custom-calendar >>> .el-calendar-table .is-legal-holiday {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.custom-calendar >>> .el-calendar-table .is-legal-holiday:hover {
  background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.custom-calendar >>> .el-calendar-table .is-legal-holiday .solar-day {
  color: #4caf50;
  font-weight: 700;
}

.custom-calendar >>> .el-calendar-table .is-legal-holiday .lunar-day {
  color: #4caf50;
  font-weight: 600;
}

/* 今天且是法定休息日的特殊样式 */
.custom-calendar >>> .el-calendar-table .is-today.is-legal-holiday {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.custom-calendar >>> .el-calendar-table .is-today.is-legal-holiday .solar-day,
.custom-calendar >>> .el-calendar-table .is-today.is-legal-holiday .lunar-day {
  color: white;
}

/* 同时是节假日和法定休息日 */
.custom-calendar >>> .el-calendar-table .is-holiday.is-legal-holiday {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.custom-calendar >>> .el-calendar-table .is-holiday.is-legal-holiday .solar-day {
  color: #e65100;
}

.custom-calendar >>> .el-calendar-table .is-holiday.is-legal-holiday .lunar-day {
  color: #e65100;
}

/* 今天且是补班日 */
.custom-calendar >>> .el-calendar-table .is-today.is-makeup-work {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.custom-calendar >>> .el-calendar-table .is-today.is-makeup-work .solar-day,
.custom-calendar >>> .el-calendar-table .is-today.is-makeup-work .lunar-day {
  color: white;
}

/* 补班日且是节假日 */
.custom-calendar >>> .el-calendar-table .is-makeup-work.is-holiday {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
}

.custom-calendar >>> .el-calendar-table .is-makeup-work.is-holiday .solar-day {
  color: #c2185b;
}

.custom-calendar >>> .el-calendar-table .is-makeup-work.is-holiday .lunar-day {
  color: #c2185b;
}

.calendar-cell {
  text-align: center;
  padding: 6px 2px;
  min-height: 45px;
}

.solar-day {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.lunar-day {
  font-size: 10px;
  color: #e6a23c;
}

/* 补班日样式 */
.custom-calendar >>> .el-calendar-table .is-makeup-work {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.custom-calendar >>> .el-calendar-table .is-makeup-work:hover {
  background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.custom-calendar >>> .el-calendar-table .is-makeup-work .solar-day {
  color: #1976d2;
  font-weight: 700;
}

.custom-calendar >>> .el-calendar-table .is-makeup-work .lunar-day {
  color: #1976d2;
  font-weight: 600;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .dashboard-container {
    flex-direction: column;
  }

  .clock-card {
    width: 100%;
    padding: 20px;
  }

  .info-grid {
    flex-wrap: wrap;
  }

  .info-item {
    min-width: calc(50% - 10px);
  }
}
</style>
