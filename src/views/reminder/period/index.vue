<template>
  <div class="app-container">
    <!-- 预测信息卡片 -->
    <el-card class="predict-card" shadow="hover">
      <div slot="header" class="card-header">
        <span>📊 经期预测</span>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="predict-item">
            <div class="predict-label">平均周期</div>
            <div class="predict-value">{{ averageCycle }} 天</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="predict-item">
            <div class="predict-label">预测下次经期</div>
            <div class="predict-value" v-if="predictedDate">{{ predictedDate }}</div>
            <div class="predict-value" v-else>暂无数据</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="predict-item">
            <div class="predict-label">距离今天</div>
            <div class="predict-value" v-if="daysUntilNext !== null">
              <span :class="{'text-danger': daysUntilNext <= 3}">{{ daysUntilNext }} 天</span>
            </div>
            <div class="predict-value" v-else>-</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="开始日期" prop="startDate">
        <el-date-picker
          v-model="queryParams.startDate"
          type="date"
          placeholder="选择日期"
          value-format="yyyy-MM-dd"
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['reminder:period:add']"
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
          v-hasPermi="['reminder:period:edit']"
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
          v-hasPermi="['reminder:period:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="periodList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="开始日期" align="center" prop="startDate" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束日期" align="center" prop="endDate" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.endDate">{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="周期天数" align="center" prop="cycleLength" width="100">
        <template slot-scope="scope">
          <span v-if="scope.row.cycleLength">{{ scope.row.cycleLength }} 天</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="心情" align="center" prop="mood" width="100" />
      <el-table-column label="症状" align="center" prop="symptom" :show-overflow-tooltip="true" />
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['reminder:period:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['reminder:period:remove']"
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
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="心情" prop="mood">
          <el-select v-model="form.mood" placeholder="请选择心情" style="width: 100%">
            <el-option label="开心" value="开心" />
            <el-option label="平静" value="平静" />
            <el-option label="烦躁" value="烦躁" />
            <el-option label="低落" value="低落" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="症状" prop="symptom">
          <el-input v-model="form.symptom" placeholder="如：腹痛、腰酸等" />
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
import { listPeriod, getPeriod, addPeriod, updatePeriod, delPeriod, getAverageCycle, predictNextPeriod } from "@/api/reminder/period";

export default {
  name: "PeriodRecord",
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
      // 经期记录表格数据
      periodList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 预测数据
      averageCycle: 28,
      predictedDate: null,
      daysUntilNext: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        startDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        startDate: [
          { required: true, message: "开始日期不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.getPredictInfo();
  },
  methods: {
    /** 查询经期记录列表 */
    getList() {
      this.loading = true;
      listPeriod(this.queryParams).then(response => {
        this.periodList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 获取预测信息 */
    getPredictInfo() {
      // 获取平均周期
      getAverageCycle().then(response => {
        this.averageCycle = response.data;
      });
      // 获取预测日期
      predictNextPeriod().then(response => {
        if (response.data) {
          this.predictedDate = this.parseTime(response.data, '{y}-{m}-{d}');
          // 计算距离今天的天数
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const predictDate = new Date(response.data);
          predictDate.setHours(0, 0, 0, 0);
          const diff = predictDate.getTime() - today.getTime();
          this.daysUntilNext = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
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
        startDate: null,
        endDate: null,
        mood: null,
        symptom: null,
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
      this.title = "新增经期记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getPeriod(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改经期记录";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updatePeriod(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getPredictInfo();
            });
          } else {
            addPeriod(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getPredictInfo();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除经期记录编号为"' + ids + '"的数据项？').then(function() {
        return delPeriod(ids);
      }).then(() => {
        this.getList();
        this.getPredictInfo();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.predict-card {
  margin-bottom: 20px;
}
.card-header {
  font-size: 16px;
  font-weight: bold;
}
.predict-item {
  text-align: center;
  padding: 10px 0;
}
.predict-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}
.predict-value {
  color: #ff6b9d;
  font-size: 20px;
  font-weight: bold;
}
.text-danger {
  color: #f56c6c;
}
</style>
