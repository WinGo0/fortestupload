<template>
  <div class="luckysheet-pivot">
    <!-- 顶部工具栏 -->
    <div class="pivot-toolbar">
      <span class="toolbar-title">数据透视表</span>
      <a-space>
        <a-button type="primary" @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出 Excel
        </a-button>
        <a-button @click="handleReset">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
      </a-space>
    </div>

    <div class="pivot-main">
      <!-- 左侧字段列表 -->
      <div class="field-panel">
        <div class="panel-header">源字段</div>
        <div class="field-list">
          <div
            v-for="field in availableFields"
            :key="field.key"
            class="field-item"
            draggable="true"
            @dragstart="handleDragStart($event, field)"
          >
            <TagOutlined class="field-icon" />
            <span>{{ field.label }}</span>
            <span class="field-type">{{ fieldTypeText(field.type) }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧配置与结果 -->
      <div class="pivot-right">
        <!-- 配置区 -->
        <div class="config-area">
          <div class="config-row">
            <!-- 行字段 -->
            <div
              class="drop-zone"
              :class="{ 'drop-active': dragOverZone === 'rows' }"
              @dragover.prevent="handleDragOver('rows')"
              @dragleave="handleDragLeave"
              @drop="handleDrop('rows', $event)"
            >
              <div class="zone-label">
                <BarsOutlined />
                行字段
              </div>
              <div class="zone-tags">
                <a-tag
                  v-for="(field, index) in rows"
                  :key="field.key"
                  closable
                  color="blue"
                  @close="removeField('rows', index)"
                >
                  {{ field.label }}
                </a-tag>
                <span v-if="rows.length === 0" class="placeholder">拖拽字段至此</span>
              </div>
            </div>

            <!-- 列字段 -->
            <div
              class="drop-zone"
              :class="{ 'drop-active': dragOverZone === 'cols' }"
              @dragover.prevent="handleDragOver('cols')"
              @dragleave="handleDragLeave"
              @drop="handleDrop('cols', $event)"
            >
              <div class="zone-label">
                <ColumnWidthOutlined />
                列字段
              </div>
              <div class="zone-tags">
                <a-tag
                  v-for="(field, index) in cols"
                  :key="field.key"
                  closable
                  color="green"
                  @close="removeField('cols', index)"
                >
                  {{ field.label }}
                </a-tag>
                <span v-if="cols.length === 0" class="placeholder">拖拽字段至此</span>
              </div>
            </div>
          </div>

          <div class="config-row">
            <!-- 值字段 -->
            <div
              class="drop-zone drop-zone-wide"
              :class="{ 'drop-active': dragOverZone === 'values' }"
              @dragover.prevent="handleDragOver('values')"
              @dragleave="handleDragLeave"
              @drop="handleDrop('values', $event)"
            >
              <div class="zone-label">
                <NumberOutlined />
                值字段
              </div>
              <div class="zone-tags">
                <div
                  v-for="(field, index) in values"
                  :key="field.key"
                  class="value-tag-wrapper"
                >
                  <a-tag closable color="orange" @close="removeField('values', index)">
                    {{ field.label }}
                  </a-tag>
                  <a-select
                    v-model:value="field.agg"
                    size="small"
                    style="width: 80px"
                    :options="aggOptions"
                  />
                </div>
                <span v-if="values.length === 0" class="placeholder">拖拽字段至此</span>
              </div>
            </div>

            <!-- 筛选字段 -->
            <div
              class="drop-zone drop-zone-wide"
              :class="{ 'drop-active': dragOverZone === 'filters' }"
              @dragover.prevent="handleDragOver('filters')"
              @dragleave="handleDragLeave"
              @drop="handleDrop('filters', $event)"
            >
              <div class="zone-label">
                <FilterOutlined />
                筛选字段
              </div>
              <div class="zone-tags">
                <a-tag
                  v-for="(field, index) in filters"
                  :key="field.key"
                  closable
                  color="purple"
                  @close="removeField('filters', index)"
                >
                  {{ field.label }}
                </a-tag>
                <span v-if="filters.length === 0" class="placeholder">拖拽字段至此</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 结果表格 -->
        <div class="result-area">
          <a-table
            :columns="pivotColumns"
            :data-source="pivotData"
            :scroll="{ x: 'max-content', y: 400 }"
            size="small"
            bordered
            :pagination="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  DownloadOutlined,
  ReloadOutlined,
  TagOutlined,
  BarsOutlined,
  ColumnWidthOutlined,
  NumberOutlined,
  FilterOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  dataSource: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['change'])

// ========== 模拟数据 ==========
const defaultFields = [
  { key: 'province', label: '省份', type: 'text' },
  { key: 'city', label: '城市', type: 'text' },
  { key: 'product', label: '产品', type: 'text' },
  { key: 'quarter', label: '季度', type: 'text' },
  { key: 'salesman', label: '销售员', type: 'text' },
  { key: 'amount', label: '销售额', type: 'number' },
  { key: 'quantity', label: '数量', type: 'number' },
  { key: 'profit', label: '利润', type: 'number' }
]

const mockData = [
  { province: '广东', city: '广州', product: '手机', quarter: 'Q1', salesman: '张三', amount: 120000, quantity: 300, profit: 24000 },
  { province: '广东', city: '广州', product: '手机', quarter: 'Q2', salesman: '张三', amount: 150000, quantity: 350, profit: 30000 },
  { province: '广东', city: '广州', product: '电脑', quarter: 'Q1', salesman: '李四', amount: 200000, quantity: 100, profit: 40000 },
  { province: '广东', city: '深圳', product: '手机', quarter: 'Q1', salesman: '王五', amount: 180000, quantity: 400, profit: 36000 },
  { province: '广东', city: '深圳', product: '平板', quarter: 'Q2', salesman: '王五', amount: 90000, quantity: 150, profit: 18000 },
  { province: '浙江', city: '杭州', product: '手机', quarter: 'Q1', salesman: '赵六', amount: 160000, quantity: 320, profit: 32000 },
  { province: '浙江', city: '杭州', product: '电脑', quarter: 'Q2', salesman: '赵六', amount: 220000, quantity: 110, profit: 44000 },
  { province: '浙江', city: '宁波', product: '平板', quarter: 'Q1', salesman: '孙七', amount: 80000, quantity: 140, profit: 16000 },
  { province: '浙江', city: '宁波', product: '手机', quarter: 'Q2', salesman: '孙七', amount: 140000, quantity: 280, profit: 28000 },
  { province: '江苏', city: '南京', product: '电脑', quarter: 'Q1', salesman: '周八', amount: 190000, quantity: 95, profit: 38000 },
  { province: '江苏', city: '南京', product: '手机', quarter: 'Q2', salesman: '周八', amount: 170000, quantity: 340, profit: 34000 },
  { province: '江苏', city: '苏州', product: '平板', quarter: 'Q1', salesman: '吴九', amount: 75000, quantity: 130, profit: 15000 },
  { province: '江苏', city: '苏州', product: '手机', quarter: 'Q2', salesman: '吴九', amount: 130000, quantity: 260, profit: 26000 },
  { province: '北京', city: '北京', product: '电脑', quarter: 'Q1', salesman: '郑十', amount: 250000, quantity: 125, profit: 50000 },
  { province: '北京', city: '北京', product: '手机', quarter: 'Q2', salesman: '郑十', amount: 210000, quantity: 420, profit: 42000 },
  { province: '上海', city: '上海', product: '平板', quarter: 'Q1', salesman: '钱一', amount: 95000, quantity: 160, profit: 19000 },
  { province: '上海', city: '上海', product: '手机', quarter: 'Q2', salesman: '钱一', amount: 195000, quantity: 390, profit: 39000 },
  { province: '四川', city: '成都', product: '电脑', quarter: 'Q1', salesman: '冯二', amount: 170000, quantity: 85, profit: 34000 },
  { province: '四川', city: '成都', product: '手机', quarter: 'Q2', salesman: '冯二', amount: 145000, quantity: 290, profit: 29000 },
  { province: '湖北', city: '武汉', product: '平板', quarter: 'Q1', salesman: '陈三', amount: 70000, quantity: 120, profit: 14000 }
]

const sourceData = computed(() => props.dataSource.length > 0 ? props.dataSource : mockData)

// ========== 字段管理 ==========
const allFields = ref(defaultFields)

const availableFields = computed(() => {
  const usedKeys = new Set([
    ...rows.value.map(f => f.key),
    ...cols.value.map(f => f.key),
    ...values.value.map(f => f.key),
    ...filters.value.map(f => f.key)
  ])
  return allFields.value.filter(f => !usedKeys.has(f.key))
})

const rows = ref([])
const cols = ref([])
const values = ref([])
const filters = ref([])

const aggOptions = [
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' },
  { label: '平均', value: 'avg' },
  { label: '最大', value: 'max' },
  { label: '最小', value: 'min' }
]

function fieldTypeText(type) {
  return type === 'number' ? '数值' : '文本'
}

// ========== 拖拽逻辑 ==========
const dragOverZone = ref(null)

function handleDragStart(event, field) {
  event.dataTransfer.setData('application/json', JSON.stringify(field))
  event.dataTransfer.effectAllowed = 'copy'
}

function handleDragOver(zone) {
  dragOverZone.value = zone
}

function handleDragLeave() {
  dragOverZone.value = null
}

function handleDrop(zone, event) {
  event.preventDefault()
  dragOverZone.value = null
  const data = event.dataTransfer.getData('application/json')
  if (!data) return

  const field = JSON.parse(data)
  const targetList = zone === 'rows' ? rows : zone === 'cols' ? cols : zone === 'values' ? values : filters

  // 避免重复
  if (targetList.value.some(f => f.key === field.key)) return

  // 值字段默认聚合方式为求和
  if (zone === 'values') {
    targetList.value.push({ ...field, agg: 'sum' })
  } else {
    targetList.value.push(field)
  }
}

function removeField(zone, index) {
  const targetList = zone === 'rows' ? rows : zone === 'cols' ? cols : zone === 'values' ? values : filters
  targetList.value.splice(index, 1)
}

// ========== 透视计算 ==========
const filteredData = computed(() => {
  if (filters.value.length === 0) return sourceData.value
  return sourceData.value.filter(row => {
    return filters.value.every(f => row[f.key] !== undefined && row[f.key] !== null && row[f.key] !== '')
  })
})

const pivotResult = computed(() => {
  const data = filteredData.value
  if (data.length === 0) return { headers: [], rows: [] }

  const rowKeys = rows.value.map(f => f.key)
  const colKeys = cols.value.map(f => f.key)
  const valConfigs = values.value

  if (rowKeys.length === 0 && colKeys.length === 0) {
    // 无行列字段，直接汇总所有值字段
    const totals = {}
    valConfigs.forEach(vc => {
      totals[vc.key] = aggregate(data, vc.key, vc.agg)
    })
    return { headers: valConfigs.map(vc => `${vc.label}(${aggLabel(vc.agg)})`), rows: [totals] }
  }

  // 按行+列分组
  const groups = {}
  data.forEach(item => {
    const rKey = rowKeys.map(k => item[k]).join('▸')
    const cKey = colKeys.map(k => item[k]).join('▸')
    const groupKey = `${rKey}||${cKey}`
    if (!groups[groupKey]) groups[groupKey] = { rKey, cKey, items: [] }
    groups[groupKey].items.push(item)
  })

  // 收集唯一的行键和列键
  const uniqueRowKeys = [...new Set(Object.values(groups).map(g => g.rKey))].sort()
  const uniqueColKeys = [...new Set(Object.values(groups).map(g => g.cKey))].sort()

  // 构建结果
  const result = []
  uniqueRowKeys.forEach(rk => {
    const row = {}
    // 行维度值
    const rowParts = rk.split('▸')
    rowKeys.forEach((rkField, idx) => {
      row[rkField] = rowParts[idx] || ''
    })

    // 各列值
    uniqueColKeys.forEach(ck => {
      const group = groups[`${rk}||${ck}`]
      valConfigs.forEach(vc => {
        const colFieldKey = colKeys.length > 0
          ? `${ck}▸${vc.key}▸${vc.agg}`
          : `${vc.key}▸${vc.agg}`
        row[colFieldKey] = group ? aggregate(group.items, vc.key, vc.agg) : 0
      })
    })

    // 行合计
    valConfigs.forEach(vc => {
      const allItems = uniqueColKeys.map(ck => groups[`${rk}||${ck}`]).filter(Boolean).flatMap(g => g.items)
      row[`__rowTotal▸${vc.key}▸${vc.agg}`] = aggregate(allItems, vc.key, vc.agg)
    })

    result.push(row)
  })

  // 列合计行
  if (result.length > 0) {
    const totalRow = {}
    rowKeys.forEach(rk => { totalRow[rk] = '合计' })

    uniqueColKeys.forEach(ck => {
      const allItems = uniqueRowKeys.map(rk => groups[`${rk}||${ck}`]).filter(Boolean).flatMap(g => g.items)
      valConfigs.forEach(vc => {
        const colFieldKey = colKeys.length > 0
          ? `${ck}▸${vc.key}▸${vc.agg}`
          : `${vc.key}▸${vc.agg}`
        totalRow[colFieldKey] = aggregate(allItems, vc.key, vc.agg)
      })
    })

    // 总计
    valConfigs.forEach(vc => {
      totalRow[`__rowTotal▸${vc.key}▸${vc.agg}`] = aggregate(data, vc.key, vc.agg)
    })

    result.push(totalRow)
  }

  return {
    rowKeys,
    colKeys,
    valConfigs,
    uniqueColKeys,
    rows: result
  }
})

function aggregate(items, key, agg) {
  const vals = items.map(i => Number(i[key]) || 0).filter(v => !isNaN(v))
  if (vals.length === 0) return 0
  switch (agg) {
    case 'sum': return vals.reduce((a, b) => a + b, 0)
    case 'count': return vals.length
    case 'avg': return vals.reduce((a, b) => a + b, 0) / vals.length
    case 'max': return Math.max(...vals)
    case 'min': return Math.min(...vals)
    default: return vals.reduce((a, b) => a + b, 0)
  }
}

function aggLabel(agg) {
  const map = { sum: '求和', count: '计数', avg: '平均', max: '最大', min: '最小' }
  return map[agg] || agg
}

// ========== 表格列定义 ==========
const pivotColumns = computed(() => {
  const result = pivotResult.value
  if (!result.rowKeys) return []

  const columns = []

  // 行维度列
  rows.value.forEach(field => {
    columns.push({
      title: field.label,
      dataIndex: field.key,
      key: field.key,
      fixed: 'left',
      width: 100,
      customCell: (record) => {
        if (record[field.key] === '合计') {
          return { style: { fontWeight: 'bold', background: '#fafafa' } }
        }
        return {}
      }
    })
  })

  // 列维度 + 值维度列
  if (result.colKeys.length > 0) {
    result.uniqueColKeys.forEach(ck => {
      const ckParts = ck.split('▸')
      const children = result.valConfigs.map(vc => ({
        title: `${vc.label}(${aggLabel(vc.agg)})`,
        dataIndex: `${ck}▸${vc.key}▸${vc.agg}`,
        key: `${ck}▸${vc.key}▸${vc.agg}`,
        width: 120,
        align: 'right',
        customCell: (record) => {
          if (record[rows.value[0]?.key] === '合计') {
            return { style: { fontWeight: 'bold', background: '#fafafa' } }
          }
          return {}
        }
      }))

      columns.push({
        title: ckParts.join(' / '),
        children
      })
    })
  } else {
    // 无列维度
    result.valConfigs.forEach(vc => {
      columns.push({
        title: `${vc.label}(${aggLabel(vc.agg)})`,
        dataIndex: `${vc.key}▸${vc.agg}`,
        key: `${vc.key}▸${vc.agg}`,
        width: 140,
        align: 'right'
      })
    })
  }

  // 合计列
  if (result.valConfigs.length > 0 && (result.colKeys.length > 0 || result.rowKeys.length > 0)) {
    const totalChildren = result.valConfigs.map(vc => ({
      title: `${vc.label}(${aggLabel(vc.agg)})`,
      dataIndex: `__rowTotal▸${vc.key}▸${vc.agg}`,
      key: `__rowTotal▸${vc.key}▸${vc.agg}`,
      width: 120,
      align: 'right',
      fixed: 'right',
      customCell: () => ({ style: { fontWeight: 'bold', background: '#fafafa' } })
    }))

    columns.push({
      title: '合计',
      children: totalChildren,
      fixed: 'right'
    })
  }

  return columns
})

const pivotData = computed(() => {
  const result = pivotResult.value
  if (!result.rows) return []
  return result.rows.map((row, index) => ({ key: index, ...row }))
})

watch(pivotData, (val) => {
  emit('change', val)
}, { deep: true })

// ========== 操作 ==========
function handleReset() {
  rows.value = []
  cols.value = []
  values.value = []
  filters.value = []
}

function handleExport() {
  // 简单导出为 CSV（luckyexcel 需要构建完整 workbook 较复杂）
  const data = pivotData.value
  const columns = pivotColumns.value

  if (data.length === 0) {
    return
  }

  // 扁平化表头
  const headers = []
  const dataIndices = []

  function extractColumns(cols, depth = 0) {
    cols.forEach(col => {
      if (col.children) {
        extractColumns(col.children, depth + 1)
      } else {
        headers.push(col.title)
        dataIndices.push(col.dataIndex)
      }
    })
  }

  extractColumns(columns)

  const csvContent = [
    headers.join(','),
    ...data.map(row => dataIndices.map(di => {
      const val = row[di]
      // 处理逗号和引号
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '透视表数据.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.luckysheet-pivot {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}

.pivot-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.pivot-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧字段面板 */
.field-panel {
  width: 180px;
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px;
  font-weight: 600;
  color: #595959;
  border-bottom: 1px solid #f0f0f0;
}

.field-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: grab;
  font-size: 13px;
  transition: all 0.2s;
}

.field-item:hover {
  border-color: #1890ff;
  color: #1890ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.field-item:active {
  cursor: grabbing;
}

.field-icon {
  font-size: 12px;
  color: #8c8c8c;
}

.field-type {
  margin-left: auto;
  font-size: 11px;
  color: #bfbfbf;
  background: #f5f5f5;
  padding: 1px 5px;
  border-radius: 3px;
}

/* 右侧区域 */
.pivot-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 配置区 */
.config-area {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.config-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.drop-zone {
  flex: 1;
  min-height: 48px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 8px 12px;
  transition: all 0.2s;
}

.drop-zone-wide {
  flex: 1;
}

.drop-zone.drop-active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.zone-label {
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.zone-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 24px;
}

.placeholder {
  font-size: 12px;
  color: #bfbfbf;
}

.value-tag-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 结果区 */
.result-area {
  flex: 1;
  overflow: auto;
  padding: 12px 16px;
}
</style>