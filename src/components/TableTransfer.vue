<template>
  <div class="table-transfer">
    <!-- 左侧表格 -->
    <div class="transfer-panel">
      <a-table
        row-key="id"
        :columns="leftCols"
        :data-source="leftTableData"
        :row-selection="leftSelection"
        :pagination="leftPagination"
        :loading="loading"
        size="small"
        bordered
        :scroll="{ y: tableHeight }"
        @change="handleLeftTableChange"
      />
    </div>

    <!-- 中间按钮 -->
    <div class="transfer-buttons">
      <a-button
        type="primary"
        :disabled="leftSelectedKeys.length === 0"
        @click="moveToRight"
      >
        <template #icon><RightOutlined /></template>
      </a-button>
      <a-button
        type="primary"
        :disabled="rightSelectedKeys.length === 0"
        @click="moveToLeft"
      >
        <template #icon><LeftOutlined /></template>
      </a-button>
    </div>

    <!-- 右侧表格 -->
    <div class="transfer-panel">
      <a-table
        row-key="id"
        :columns="rightCols"
        :data-source="rightTableData"
        :row-selection="rightSelection"
        :pagination="false"
        size="small"
        bordered
        :scroll="{ y: tableHeight }"
      >
        <!-- 金额列：可编辑 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'amount'">
            <a-input-number
              v-model:value="record.amount"
              :precision="6"
              :controls="false"
              size="small"
              style="width: 100%"
              @change="handleAmountChange"
            />
          </template>
          <template v-if="column.key === 'unit'">
            <span style="color: #e6a23c;">(万元)</span>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RightOutlined, LeftOutlined } from '@ant-design/icons-vue'
// import axios from 'axios'  // TODO: 接口通后启用

const props = defineProps({
  /** 右侧已选数据，支持 v-model */
  modelValue: {
    type: Array,
    default: () => []
  },
  // TODO: 接口通后启用
  // fetchUrl: {
  //   type: String,
  //   default: '/api/contract/available-items'
  // },
  /** 表格滚动高度 */
  tableHeight: {
    type: Number,
    default: 280
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// ====== 列配置 ======
const leftCols = [
  { title: '电厂', dataIndex: 'plantName', width: 100 },
  { title: '机组', dataIndex: 'unitName', width: 100 },
  { title: '循环', dataIndex: 'cycleName', width: 100 }
]

const rightCols = [
  { title: '电厂', dataIndex: 'plantName', width: 80 },
  { title: '机组', dataIndex: 'unitName', width: 80 },
  { title: '循环', dataIndex: 'cycleName', width: 80 },
  { title: '金额', dataIndex: 'amount', width: 120 },
  { title: '', key: 'unit', width: 60 }
]

// ====== 数据 ======
const loading = ref(false)
const allSourceData = ref([])          // 接口获取的全量数据（左侧固定不变）
const rightTableData = ref([...props.modelValue])  // 右侧已选数据

// 左侧数据 = 接口返回的全量数据，固定不变
const leftTableData = computed(() => allSourceData.value)

// ====== 分页 ======
const leftPagination = ref({
  current: 1,
  pageSize: 30,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '30', '50'],
  showTotal: (total) => `共${total}条数据`
})

function handleLeftTableChange(pagination) {
  leftPagination.value.current = pagination.current
  leftPagination.value.pageSize = pagination.pageSize
}

// ====== 选中状态 ======
const leftSelectedKeys = ref([])
const rightSelectedKeys = ref([])

const leftSelection = computed(() => ({
  selectedRowKeys: leftSelectedKeys.value,
  onChange: (keys) => { leftSelectedKeys.value = keys }
}))

const rightSelection = computed(() => ({
  selectedRowKeys: rightSelectedKeys.value,
  onChange: (keys) => { rightSelectedKeys.value = keys }
}))

// ====== 穿梭操作 ======

/** 左 → 右：将选中行添加到右侧（已存在的不重复添加） */
function moveToRight() {
  const keysSet = new Set(leftSelectedKeys.value)
  const existingIds = new Set(rightTableData.value.map(r => r.id))

  const selected = allSourceData.value
    .filter(item => keysSet.has(item.id) && !existingIds.has(item.id))
    .map(item => ({ ...item, amount: item.amount ?? 0 }))

  rightTableData.value = [...rightTableData.value, ...selected]
  leftSelectedKeys.value = []
  emitChange()
}

/** 右 → 左：从右侧删除选中行 */
function moveToLeft() {
  const keysSet = new Set(rightSelectedKeys.value)
  rightTableData.value = rightTableData.value.filter(item => !keysSet.has(item.id))
  rightSelectedKeys.value = []
  emitChange()
}

function handleAmountChange() {
  emitChange()
}

function emitChange() {
  emit('update:modelValue', [...rightTableData.value])
  emit('change', [...rightTableData.value])
}

// ====== 数据加载 ======
// TODO: 接口通后替换为真实请求，示例：
// async function fetchData() {
//   loading.value = true
//   try {
//     const res = await axios.get(props.fetchUrl)
//     allSourceData.value = res.data?.data || res.data || []
//   } finally {
//     loading.value = false
//   }
// }
function fetchData() {
  allSourceData.value = generateMockData()
}

/** 模拟数据（开发调试用，接口通后可删除） */
function generateMockData() {
  const plants = ['秦二厂', '秦三厂', '海阳厂', '田湾厂', '福清厂']
  const units = ['1号机组', '2号机组', '3号机组', '4号机组']
  const cycles = ['U2C21', 'U3C18', 'U1C15', 'U4C10']
  return Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    plantName: plants[i % plants.length],
    unitName: units[i % units.length],
    cycleName: cycles[i % cycles.length]
  }))
}

onMounted(() => {
  fetchData()
})

// 暴露给父组件
defineExpose({
  getSelectedData: () => [...rightTableData.value],
  clearSelected: () => {
    rightTableData.value = []
    emitChange()
  },
  reload: fetchData
})
</script>

<style scoped>
.table-transfer {
  display: flex;
  align-items: stretch;
}

.transfer-panel {
  flex: 1;
  overflow: hidden;
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 12px;
}
</style>
