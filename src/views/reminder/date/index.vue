<template>
  <div class="app-container">
    <!-- 当前日期信息卡片 -->
    <el-card class="date-info-card" shadow="hover">
      <div slot="header" class="card-header">
        <span>📅 今日信息</span>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <div class="info-label">公历日期</div>
            <div class="info-value">{{ solarDate }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <div class="info-label">农历日期</div>
            <div class="info-value lunar">{{ lunarDate }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <div class="info-label">星期</div>
            <div class="info-value">{{ weekDay }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

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
          <el-option label="其他" :value="3" />
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
          <el-tag v-else type="info">其他</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="公历日期" align="center" prop="dateValue" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.dateValue, '{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="农历日期" align="center" width="120">
        <template slot-scope="scope">
          <span class="lunar">{{ getLunarDate(scope.row.dateValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="农历" align="center" prop="isLunar" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.isLunar === 1" type="success" size="small">是</el-tag>
          <el-tag v-else type="info" size="small">否</el-tag>
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
          <el-select v-model="form.dateType" placeholder="请选择类型" style="width: 100%">
            <el-option label="生日" :value="1" />
            <el-option label="纪念日" :value="2" />
            <el-option label="其他" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="dateValue">
          <el-date-picker
            v-model="form.dateValue"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="农历" prop="isLunar">
          <el-radio-group v-model="form.isLunar">
            <el-radio :label="0">公历</el-radio>
            <el-radio :label="1">农历</el-radio>
          </el-radio-group>
        </el-form-item>
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
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        dateType: null
      },
      // 表单参数
      form: {},
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
        ]
      }
    };
  },
  created() {
    this.getList();
    this.initCurrentDate();
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
    /** 获取农历日期 */
    getLunarDate(date) {
      if (!date) return '';
      const d = new Date(date);
      const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return `${lunar.monthStr}${lunar.dayStr}`;
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
        this.loading = false;
      });
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
        dateType: null,
        dateValue: null,
        repeatType: 1,
        remindDaysBefore: 3,
        remindTime: '09:00',
        isLunar: 0,
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
          // 用农历日期填充表单，让用户看到原始输入
          this.form.dateValue = `${lunar.lunarYear}-${String(lunar.lunarMonth).padStart(2, '0')}-${String(lunar.lunarDay).padStart(2, '0')}`;
        }
        this.open = true;
        this.title = "修改重要日期";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 如果选择了农历，将用户输入的日期当作农历日期，转换为公历日期存储
          const submitData = { ...this.form };
          if (submitData.isLunar === 1 && submitData.dateValue) {
            const parts = submitData.dateValue.split('-');
            const lunarYear = parseInt(parts[0]);
            const lunarMonth = parseInt(parts[1]);
            const lunarDay = parseInt(parts[2]);
            // 将用户选的日期视为农历日期，转换为公历
            const solar = lunarToSolar(lunarYear, lunarMonth, lunarDay, false);
            submitData.dateValue = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`;
          }
          if (submitData.id != null) {
            updateDate(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDate(submitData).then(response => {
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
.date-info-card {
  margin-bottom: 20px;
}
.card-header {
  font-size: 16px;
  font-weight: bold;
}
.info-item {
  text-align: center;
  padding: 10px 0;
}
.info-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}
.info-value {
  color: #303133;
  font-size: 18px;
  font-weight: bold;
}
.info-value.lunar {
  color: #e6a23c;
}
.lunar {
  color: #e6a23c;
  font-size: 13px;
}
</style>
