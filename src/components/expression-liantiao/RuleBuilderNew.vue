<template>
  <div class="rule-builder">
    <h3 class="rule-builder-title">规则引擎配置（CRUD + 字段回填试验）</h3>

    <div class="toolbar">
      <el-button type="success" @click="handleCreate">新增配置</el-button>
      <el-input
        v-model="configName"
        placeholder="配置名称"
        style="width: 200px"
        size="large"
      />
      <el-input
        v-model="remark"
        placeholder="备注"
        style="width: 200px"
        size="large"
      />
      <el-button type="primary" @click="handleSave">
        {{ currentId ? '保存（编辑）' : '保存（新增）' }}
      </el-button>
      <el-button @click="logDataToConsole">控制台输出当前树</el-button>
      <el-tag v-if="currentId" type="warning">当前编辑配置 ID: {{ currentId }}</el-tag>
      <el-tag v-else type="info">新增模式</el-tag>
    </div>

    <el-table
      :data="configList"
      border
      size="small"
      style="margin-bottom: 1rem"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="configName" label="配置名称" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="updatedTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="240">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">
            编辑回填
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
          <el-button
            type="warning"
            size="small"
            @click="handleQueryDescription(scope.row)"
          >
            查询描述
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div>
      <RuleNodeNew
        v-if="rootGroup && rootGroup.children"
        :node="rootGroup"
        :path="[]"
        @promote-to-group="handleRuleAdditionClick"
        @add-rule-to-group="addRuleToGroup"
        @remove-node="removeNode"
        @toggle-operator="toggleOperator"
        @update-node-value="updateNodeValue"
        @open-param-select="handleOpenParamSelect"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="请选择参数"
      width="400px"
      append-to-body
    >
      <div v-if="paramOptions.length" class="param-list">
        <div
          v-for="item in paramOptions"
          :key="item.paramCode"
          class="param-item"
          @click="confirmParamSelect(item.paramCode)"
        >
          <span>
            <b>{{ item.paramCode }}</b> {{ item.paramName }}
            <span class="param-desc">（{{ item.desc }}）</span>
          </span>
          <span style="color: #409eff">选择</span>
        </div>
      </div>
      <el-empty
        v-else
        description="暂无参数，请确认后端 /api/expression-config/params 接口可用"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RuleNodeNew from './RuleNodeNew.vue'

const API = '/api/expression-config'

const createNewRuleNode = () => ({
  nodeType: 'CONDITION_NODE',
  type: 'REAL_TIME',
  paramCode: '',
  operator: 'GT',
  threshold: null,
  timeValue: 1,
  timeUnit: 'SECOND',
  targetState: 1,
  openRangeStart: null,
  openRangeEnd: null,
  closeRangeStart: null,
  closeRangeEnd: null
})

const createDefaultRoot = () => ({
  nodeType: 'LOGIC_NODE',
  logicOperator: 'AND',
  children: [createNewRuleNode()]
})

const rootGroup = ref(createDefaultRoot())

const currentId = ref(null)
const configName = ref('')
const remark = ref('')
const configList = ref([])

const dialogVisible = ref(false)
const targetParamPath = ref([])
const paramOptions = ref([])

const loadParams = async () => {
  try {
    const res = await fetch(`${API}/params`)

    if (res.ok) {
      paramOptions.value = await res.json()
    }
  } catch (error) {
    console.error('加载参数列表失败', error)
  }
}

const findNodeContext = (path) => {
  if (!rootGroup.value || !rootGroup.value.children) {
    return { parentChildren: [], nodeIndex: -1 }
  }

  let parentChildren = rootGroup.value.children

  for (let index = 0; index < path.length - 1; index += 1) {
    if (
      !parentChildren[path[index]] ||
      !parentChildren[path[index]].children
    ) {
      return { parentChildren: [], nodeIndex: -1 }
    }

    parentChildren = parentChildren[path[index]].children
  }

  return {
    parentChildren,
    nodeIndex: path[path.length - 1]
  }
}

const findNodeByPath = (path) => {
  if (!path) return null
  if (path.length === 0) return rootGroup.value
  if (!rootGroup.value || !rootGroup.value.children) return null

  let currentNode = rootGroup.value

  for (const index of path) {
    if (!currentNode.children || !currentNode.children[index]) return null
    currentNode = currentNode.children[index]
  }

  return currentNode
}

const addRuleToGroup = (path) => {
  const groupNode = findNodeByPath(path)

  if (groupNode && groupNode.nodeType === 'LOGIC_NODE') {
    if (!groupNode.children) {
      groupNode.children = []
    }

    groupNode.children.push(createNewRuleNode())
  }
}

const handleRuleAdditionClick = (path) => {
  if (
    path.length === 1 &&
    path[0] === 0 &&
    rootGroup.value.children &&
    rootGroup.value.children.length === 1
  ) {
    addRuleToGroup([])
  } else {
    promoteRuleToGroup(path)
  }
}

const promoteRuleToGroup = (path) => {
  const { parentChildren, nodeIndex } = findNodeContext(path)

  if (!parentChildren || nodeIndex < 0 || !parentChildren[nodeIndex]) {
    return
  }

  const ruleToPromote = parentChildren[nodeIndex]
  const newGroup = {
    nodeType: 'LOGIC_NODE',
    logicOperator: 'AND',
    children: [ruleToPromote, createNewRuleNode()]
  }

  parentChildren.splice(nodeIndex, 1, newGroup)
}

const removeNode = (path) => {
  if (
    path.length === 1 &&
    rootGroup.value.children &&
    rootGroup.value.children.length === 1
  ) {
    ElMessage.warning('为了保持至少一条规则，无法删除最后一条。')
    return
  }

  const { parentChildren, nodeIndex } = findNodeContext(path)

  if (!parentChildren || nodeIndex < 0) return

  parentChildren.splice(nodeIndex, 1)

  const parentPath = path.slice(0, -1)

  if (parentChildren.length === 1 && parentPath.length > 0) {
    const {
      parentChildren: grandParentChildren,
      nodeIndex: parentIndexInGrandparent
    } = findNodeContext(parentPath)

    if (!grandParentChildren || parentIndexInGrandparent < 0) return

    const lonelyChild = parentChildren[0]
    grandParentChildren.splice(parentIndexInGrandparent, 1, lonelyChild)
  }
}

const toggleOperator = (path) => {
  const groupNode = findNodeByPath(path)

  if (groupNode && groupNode.nodeType === 'LOGIC_NODE') {
    groupNode.logicOperator =
      groupNode.logicOperator === 'AND' ? 'OR' : 'AND'
  }
}

const updateNodeValue = ({ path, field, value }) => {
  const targetNode = findNodeByPath(path)

  if (!targetNode || targetNode.nodeType !== 'CONDITION_NODE') return

  targetNode[field] = value
}

const handleOpenParamSelect = (path) => {
  targetParamPath.value = path
  dialogVisible.value = true
}

const confirmParamSelect = (selectedValue) => {
  updateNodeValue({
    path: targetParamPath.value,
    field: 'paramCode',
    value: selectedValue
  })
  dialogVisible.value = false
  ElMessage.success('参数已选择')
}

const loadList = async () => {
  const res = await fetch(`${API}/list`)
  configList.value = await res.json()
}

const handleCreate = () => {
  currentId.value = null
  configName.value = ''
  remark.value = ''
  rootGroup.value = JSON.parse(JSON.stringify(createDefaultRoot()))
  ElMessage.success('已进入新增模式，请编辑后保存')
}

const handleEdit = async (row) => {
  const res = await fetch(`${API}/detail?id=${row.id}`)
  const data = await res.json()

  if (!data.config) {
    ElMessage.error(`未查询到配置: ${row.id}`)
    return
  }

  currentId.value = row.id
  configName.value = row.configName
  remark.value = row.remark
  rootGroup.value = JSON.parse(JSON.stringify(data.config))
  ElMessage.success(`配置 ${row.id} 已回填，请编辑后保存`)
}

const handleSave = async () => {
  if (!configName.value) {
    ElMessage.warning('请填写配置名称')
    return
  }

  const payload = {
    id: currentId.value,
    configName: configName.value,
    remark: remark.value,
    configJson: rootGroup.value
  }

  const res = await fetch(`${API}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()

  if (!res.ok) {
    ElMessage.error(data.message || '保存失败')
    return
  }

  currentId.value = data.id
  ElMessage.success(`保存成功，id = ${data.id}`)
  loadList()
}

const handleDelete = async (row) => {
  const res = await fetch(`${API}/${row.id}`, { method: 'DELETE' })

  if (res.ok) {
    ElMessage.success('删除成功')

    if (currentId.value === row.id) {
      handleCreate()
    }

    loadList()
  }
}

const handleQueryDescription = async (row) => {
  const res = await fetch(`${API}/description?id=${row.id}`)
  const data = await res.json()

  if (!res.ok) {
    ElMessage.error(data.message || '查询描述失败')
    return
  }

  ElMessageBox.alert(
    data.description || '暂无描述',
    `配置 ${row.id}（${row.configName}）的表达式描述`,
    { confirmButtonText: '确定' }
  )
}

const logDataToConsole = () => {
  console.log(JSON.stringify(rootGroup.value, null, '  '))
  ElMessage.success('配置已输出到控制台')
}

onMounted(() => {
  loadList()
  loadParams()
})
</script>

<style scoped>
.rule-builder-title {
  margin: 0 0 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 1rem;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.2s;
}

.param-item:hover {
  color: #409eff;
  background-color: #ecf5ff;
  border-color: #409eff;
}

.param-desc {
  font-size: 12px;
  color: #909399;
}
</style>
