<template>
  <div class="task-execution-container">
    <div class="page-title">定时任务执行信息</div>

    <!-- 顶部搜索区 -->
    <div class="search-wrapper">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务执行时间：">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            range-separator="—"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-wrapper">
      <!-- 
        :key="tableKey" 非常重要：当 headers 结构发生变化时，更新 key 强制重绘，防止列宽错乱 
      -->
      <el-table
        :key="tableKey"
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#333', fontWeight: 'bold' }"
      >
        <template v-for="(header, index) in tableHeaders" :key="header.name + index">
          
          <!-- 场景 1: 时间类型 (固定在左侧) -->
          <el-table-column
            v-if="header.type === 'time'"
            :prop="header.children[0].code"
            :label="header.name"
            width="180"
            align="center"
            fixed="left"
          />

          <!-- 场景 2: 参数组类型 (多级表头) -->
          <el-table-column
            v-else-if="header.type === 'group' && header.children && header.children.length > 0"
            :label="header.name"
            align="center"
          >
            <el-table-column
              v-for="child in header.children"
              :key="child.code"
              :prop="child.code"
              :label="child.name"
              align="center"
              min-width="120"
              show-overflow-tooltip
              :formatter="emptyFormatter"
            />
          </el-table-column>

          <!-- 场景 3: 独立参数类型 (单级表头) -->
          <!-- 独立参数的 json 结构里虽然有 children，但只有一个，直接取 children[0].code 绑定 -->
          <el-table-column
            v-else-if="header.type === 'single'"
            :prop="header.children[0].code"
            :label="header.name"
            align="center"
            min-width="120"
            show-overflow-tooltip
            :formatter="emptyFormatter"
          />

        </template>
      </el-table>
    </div>

    <!-- 分页区域 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, prev, pager, next, sizes, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// --- 状态定义 ---
const loading = ref(false)
const tableKey = ref(Date.now()) // 触发表格重绘的key

const searchForm = reactive({
  timeRange: []
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableHeaders = ref([])
const tableData = ref([])

// --- 方法定义 ---

// 格式化空数据：如果数据是空字符串 ""，则显示 "--"
const emptyFormatter = (row, column, cellValue) => {
  if (cellValue === null || cellValue === undefined || cellValue === '') {
    return '--'
  }
  return cellValue
}

// 模拟获取接口数据
const fetchData = async () => {
  loading.value = true
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 这里直接使用你提供的优秀的 JSON 数据结构
    const mockRes = {
      code: 200,
      data: {
        total: 20,
        headers: [
          { "name": "执行时间", "type": "time", "groupId": null, "children": [ { "code": "EXECUTE_TIME", "name": "执行时间" } ] },
          { "name": "延迟", "type": "group", "groupId": 2, "children": [ { "code": "2::cpu", "name": "cpu" }, { "code": "2::mem", "name": "mem" } ] },
          { "name": "网络质量", "type": "group", "groupId": 1, "children": [ { "code": "lixianlei", "name": "延迟" }, { "code": "1::loss", "name": "丢包率" } ] },
          { "name": "错误数", "type": "single", "groupId": -1, "children": [ { "code": "-1::error_count", "name": "错误数" } ] },
          { "name": "新增字段", "type": "single", "groupId": -1, "children": [ { "code": "lixianlei", "name": "新增字段" } ] },
          { "name": "总耗时", "type": "single", "groupId": -1, "children": [ { "code": "-1::total_time", "name": "总耗时" } ] }
        ],
        rows: [
          { "EXECUTE_TIME": "2026-05-02 10:00:00", "2::cpu": "", "2::mem": "", "lixianlei": "12", "1::loss": "1", "-1::error_count": "2", "lixianlei": "", "-1::total_time": "105" },
          { "EXECUTE_TIME": "2026-05-02 10:10:00", "2::cpu": "", "2::mem": "", "lixianlei": "14", "1::loss": "2", "-1::error_count": "1", "lixianlei": "", "-1::total_time": "108" },
          { "EXECUTE_TIME": "2026-05-02 10:50:00", "2::cpu": "25", "2::mem": "32", "lixianlei": "22", "1::loss": "1", "-1::error_count": "2", "lixianlei": "", "-1::total_time": "124" },
          { "EXECUTE_TIME": "2026-05-02 11:40:00", "2::cpu": "22", "2::mem": "33", "lixianlei": "11", "1::loss": "1", "-1::error_count": "", "lixianlei": "55", "-1::total_time": "102" },
          { "EXECUTE_TIME": "2026-05-02 12:00:00", "2::cpu": "28", "2::mem": "37", "lixianlei": "15", "1::loss": "", "-1::error_count": "", "lixianlei": "61", "-1::total_time": "110" }
        ]
      }
    }

    // 赋值
    tableHeaders.value = mockRes.data.headers || []
    tableData.value = mockRes.data.rows || []
    pagination.total = mockRes.data.total
    
    // 更新 Key，强制 el-table 根据新的列数重新计算 DOM 结构
    tableKey.value = Date.now()

  } catch (error) {
    console.error("获取数据失败:", error)
  } finally {
    loading.value = false
  }
}

// 交互事件
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.timeRange = []
  handleSearch()
}

const handleSizeChange = (val) => {
  pagination.size = val
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchData()
}

// --- 初始化 ---
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.task-execution-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
}

.search-wrapper {
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

/* 调整表格边框风格，贴近原图 */
:deep(.el-table) {
  border: 1px solid #ebeef5;
}
:deep(.el-table th.el-table__cell) {
  border-right: 1px solid #dcdfe6;
  border-bottom: 1px solid #dcdfe6;
}
:deep(.el-table td.el-table__cell) {
  border-right: 1px solid #ebeef5;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>