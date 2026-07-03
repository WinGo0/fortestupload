<template>
  <div class="phase-config">
    <!-- 阶段流程选择 -->
    <el-form :model="form" label-width="100px">
      <el-form-item label="阶段流程:" required>
        <el-radio-group v-model="form.flowType">
          <el-radio label="serial">串行流程</el-radio>
          <el-radio label="parallel">并行流程</el-radio>
          <el-radio label="custom">自定义流程</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <!-- 阶段列表 -->
    <div class="phase-list">
      <div
        v-for="(phase, phaseIndex) in form.phases"
        :key="phase.id"
        class="phase-card"
      >
        <!-- 阶段头部 -->
        <div class="phase-header" @click="toggleCollapse(phaseIndex)">
          <span class="phase-title">{{ phase.name }}</span>
          <div class="phase-actions" @click.stop>
            <el-button type="primary" :icon="Plus" @click="addPhase(phaseIndex)">
              添加下一阶段
            </el-button>
            <el-button :icon="Delete" @click="removePhase(phaseIndex)">
              删除
            </el-button>
            <el-button
              :icon="phase.collapsed ? ArrowDown : ArrowUp"
              circle
              size="small"
              @click="toggleCollapse(phaseIndex)"
            />
          </div>
        </div>

        <!-- 阶段内容（可折叠） -->
        <el-collapse-transition>
          <div v-show="!phase.collapsed" class="phase-body">
            <!-- 阶段开始 -->
            <div class="section">
              <div class="section-title">
                <span class="required">*</span>
                阶段开始:
                <span class="tip">根据配置的条件判断是否启动阶段监控</span>
              </div>

              <div class="auto-judge">
                <span class="label">自动判定设置:</span>
                <div class="condition-tree">
                  <condition-node
                    v-model="phase.startConditions"
                    :depth="0"
                  />
                </div>
              </div>
            </div>

            <!-- 阶段监控规则 -->
            <div class="section">
              <div class="section-title">
                <span class="required">*</span>
                阶段监控规则:
                <span class="tip">一次添加一个监控参数，阶段内可有多个参数表达式判断，点击添加参数监控规则</span>
              </div>

              <el-form-item label="阶段规则逻辑:">
                <el-select v-model="phase.ruleLogic" style="width: 200px">
                  <el-option label="任意满足（||）" value="any" />
                  <el-option label="全部满足（&&）" value="all" />
                </el-select>
              </el-form-item>

              <el-button type="primary" :icon="Plus" class="add-rule-btn" @click="addMonitorRule(phaseIndex)">
                +规则
              </el-button>

              <el-table :data="pagedRules(phase)" border style="width: 100%; margin-top: 10px">
                <el-table-column prop="paramCode" label="参数编码" align="center" />
                <el-table-column prop="valueType" label="值类型" align="center" />
                <el-table-column prop="expression" label="表达式fx" align="center" />
                <el-table-column label="是否必要" align="center" width="100">
                  <template #default="{ row }">
                    <el-switch v-model="row.required" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="80">
                  <template #default="{ $index }">
                    <el-button link type="primary" @click="removeMonitorRule(phaseIndex, $index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <el-pagination
                v-if="phase.monitorRules.length > 10"
                v-model:current-page="phase.rulePage"
                :page-size="10"
                layout="prev, pager, next"
                :total="phase.monitorRules.length"
                class="rule-pagination"
              />
            </div>

            <!-- 阶段结束 -->
            <div class="section">
              <div class="section-title">
                <span class="required">*</span>
                阶段结束:
                <span class="tip">满足任意退出条件，阶段结束，包含超时退出及满足条件退出；</span>
              </div>

              <div class="end-config">
                <div class="timeout-config">
                  <span class="label">阶段超时结束:</span>
                  <el-input-number v-model="phase.timeoutValue" :min="1" style="width: 120px" />
                  <el-select v-model="phase.timeoutUnit" style="width: 100px; margin-left: 10px">
                    <el-option label="小时" value="hour" />
                    <el-option label="分钟" value="minute" />
                    <el-option label="秒" value="second" />
                  </el-select>
                </div>

                <div class="auto-judge" style="margin-top: 15px">
                  <span class="label">自动判定设置:</span>
                  <div class="condition-tree">
                    <condition-node
                      v-model="phase.endConditions"
                      :depth="0"
                    />
                  </div>
                </div>
              </div>

              <el-form-item label="阶段备注:" style="margin-top: 15px">
                <el-input
                  v-model="phase.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>

    <!-- 添加监控规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" title="添加监控规则" width="500px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="参数编码">
          <el-input v-model="ruleForm.paramCode" placeholder="请输入参数编码" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-select v-model="ruleForm.valueType" style="width: 100%">
            <el-option label="当前值" value="current" />
            <el-option label="平均值" value="avg" />
            <el-option label="最大值" value="max" />
            <el-option label="最小值" value="min" />
          </el-select>
        </el-form-item>
        <el-form-item label="表达式">
          <div class="expression-input">
            <el-select v-model="ruleForm.operator" style="width: 100px">
              <el-option label=">" value=">" />
              <el-option label="<" value="<" />
              <el-option label=">=" value=">=" />
              <el-option label="<=" value="<=" />
              <el-option label="=" value="=" />
              <el-option label="<>" value="<>" />
              <el-option label="><" value="><" />
            </el-select>
            <el-input v-model="ruleForm.value" placeholder="请输入数值" style="flex: 1; margin-left: 10px" />
          </div>
          <div v-if="ruleForm.operator === '><' || ruleForm.operator === '<>'" class="range-hint">
            范围格式：最小值~最大值，如 10~100
          </div>
        </el-form-item>
        <el-form-item label="是否必要">
          <el-switch v-model="ruleForm.required" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRule">确定</el-button>
      </template>
    </el-dialog>

    <!-- 底部按钮 -->
    <div class="footer-actions">
      <el-button @click="prevStep">上一步</el-button>
      <el-button type="primary" @click="nextStep">下一步</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, Delete, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 条件节点组件（递归组件）
const ConditionNode = {
  name: 'ConditionNode',
  props: ['modelValue', 'depth'],
  emits: ['update:modelValue'],
  template: `
    <div class="condition-node">
      <div v-for="(item, index) in modelValue" :key="index" class="condition-row">
        <div class="logic-badge" :class="item.logic">{{ item.logic === 'and' ? '且' : '或' }}</div>
        <span class="when-text">——当</span>
        <el-input v-model="item.param" placeholder="请选择参数" style="width: 150px" />
        <span class="of-text">的</span>
        <el-select v-model="item.valueType" style="width: 100px">
          <el-option label="当前值" value="current" />
        </el-select>
        <span class="status-text">处于</span>
        <el-select v-model="item.operator" style="width: 100px">
          <el-option label=">" value=">" />
          <el-option label="<" value="<" />
          <el-option label="=" value="=" />
          <el-option label="符号" value="symbol" />
        </el-select>
        <el-input v-model="item.value" placeholder="请输入数值" style="width: 120px" />
        <div class="node-actions">
          <el-button :icon="Plus" circle size="small" @click="addChild(index)" />
          <el-button :icon="Delete" circle size="small" @click="removeItem(index)" />
        </div>
      </div>
      <div v-if="depth < 2" class="add-condition">
        <el-button link type="primary" @click="addCondition">+ 添加条件</el-button>
      </div>
      <condition-node
        v-if="item.children && item.children.length"
        v-for="(item, idx) in modelValue"
        :key="'child-' + idx"
        v-model="item.children"
        :depth="depth + 1"
      />
    </div>
  `,
  setup(props, { emit }) {
    const addCondition = () => {
      const newVal = [...props.modelValue, {
        logic: props.modelValue.length > 0 ? 'and' : 'and',
        param: '',
        valueType: 'current',
        operator: '>',
        value: '',
        children: []
      }]
      emit('update:modelValue', newVal)
    }

    const addChild = (index) => {
      const newVal = [...props.modelValue]
      if (!newVal[index].children) newVal[index].children = []
      newVal[index].children.push({
        logic: 'and',
        param: '',
        valueType: 'current',
        operator: '>',
        value: '',
        children: []
      })
      emit('update:modelValue', newVal)
    }

    const removeItem = (index) => {
      const newVal = props.modelValue.filter((_, i) => i !== index)
      emit('update:modelValue', newVal)
    }

    return { addCondition, addChild, removeItem }
  }
}

const form = reactive({
  flowType: 'parallel',
  phases: [
    {
      id: 1,
      name: '阶段一',
      collapsed: false,
      startConditions: [
        { logic: 'and', param: 'U2_AI1117', valueType: 'current', operator: '>', value: '7', children: [] }
      ],
      ruleLogic: 'any',
      monitorRules: [
        { paramCode: 'U2_AI1117', valueType: '当前值', expression: '>100', required: false },
        { paramCode: 'U1_AI1116', valueType: '当前值', expression: '<1234567890123.12345678', required: false },
        { paramCode: 'U2_AI1118', valueType: '当前值', expression: '>=1234567890123.12345678', required: false },
        { paramCode: 'U1_AI1119', valueType: '当前值', expression: '<=1234567890123.12345678', required: false },
        { paramCode: 'U2_AI1113', valueType: '当前值', expression: '<>10~100', required: false },
        { paramCode: 'U1_AI1114', valueType: '当前值', expression: '><10~100', required: false },
      ],
      rulePage: 1,
      timeoutValue: 1,
      timeoutUnit: 'hour',
      endConditions: [],
      remark: ''
    },
    {
      id: 2,
      name: '阶段二',
      collapsed: false,
      startConditions: [],
      ruleLogic: 'any',
      monitorRules: [],
      rulePage: 1,
      timeoutValue: 1,
      timeoutUnit: 'hour',
      endConditions: [],
      remark: ''
    }
  ]
})

const ruleDialogVisible = ref(false)
const currentPhaseIndex = ref(0)
const ruleForm = reactive({
  paramCode: '',
  valueType: 'current',
  operator: '>',
  value: '',
  required: false
})

// 折叠/展开
const toggleCollapse = (index) => {
  form.phases[index].collapsed = !form.phases[index].collapsed
}

// 分页后的规则
const pagedRules = (phase) => {
  const start = (phase.rulePage - 1) * 10
  return phase.monitorRules.slice(start, start + 10)
}

const addPhase = (index) => {
  const newPhase = {
    id: Date.now(),
    name: `阶段${form.phases.length + 1}`,
    collapsed: false,
    startConditions: [],
    ruleLogic: 'any',
    monitorRules: [],
    rulePage: 1,
    timeoutValue: 1,
    timeoutUnit: 'hour',
    endConditions: [],
    remark: ''
  }
  form.phases.splice(index + 1, 0, newPhase)
}

const removePhase = async (index) => {
  if (form.phases.length <= 1) {
    ElMessage.warning('至少保留一个阶段')
    return
  }
  await ElMessageBox.confirm('确定删除该阶段吗？', '提示', { type: 'warning' })
  form.phases.splice(index, 1)
}

const addMonitorRule = (phaseIndex) => {
  currentPhaseIndex.value = phaseIndex
  Object.assign(ruleForm, {
    paramCode: '',
    valueType: 'current',
    operator: '>',
    value: '',
    required: false
  })
  ruleDialogVisible.value = true
}

const confirmAddRule = () => {
  const expression = `${ruleForm.operator}${ruleForm.value}`
  form.phases[currentPhaseIndex.value].monitorRules.push({
    paramCode: ruleForm.paramCode,
    valueType: ruleForm.valueType === 'current' ? '当前值' : ruleForm.valueType,
    expression,
    required: ruleForm.required
  })
  ruleDialogVisible.value = false
  ElMessageBox.success('添加成功')
}

const removeMonitorRule = (phaseIndex, ruleIndex) => {
  const start = (form.phases[phaseIndex].rulePage - 1) * 10
  form.phases[phaseIndex].monitorRules.splice(start + ruleIndex, 1)
}

const prevStep = () => {
  console.log('上一步')
}

const nextStep = () => {
  console.log('下一步', form)
}
</script>

<style scoped>
.phase-config {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.phase-list {
  margin-top: 20px;
}

.phase-card {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 20px;
  background: #fff;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #409eff;
  background: #f5f7fa;
  cursor: pointer;
  user-select: none;
}

.phase-header:hover {
  background: #ecf5ff;
}

.phase-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.phase-actions {
  display: flex;
  gap: 8px;
}

.phase-body {
  overflow: hidden;
}

.section {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 15px;
  font-weight: 500;
}

.required {
  color: #f56c6c;
  margin-right: 4px;
}

.tip {
  color: #e6a23c;
  font-size: 14px;
  margin-left: 10px;
  font-weight: normal;
}

.auto-judge {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.auto-judge .label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
  margin-top: 8px;
}

.condition-tree {
  flex: 1;
}

.condition-node {
  position: relative;
  padding-left: 20px;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.logic-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.logic-badge.and {
  background: #409eff;
}

.logic-badge.or {
  background: #e6a23c;
}

.when-text, .of-text, .status-text {
  color: #909399;
  font-size: 14px;
}

.node-actions {
  display: flex;
  gap: 5px;
}

.add-condition {
  margin-top: 10px;
  padding-left: 36px;
}

.timeout-config {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timeout-config .label {
  color: #606266;
  font-size: 14px;
}

.add-rule-btn {
  margin-bottom: 10px;
}

.rule-pagination {
  margin-top: 15px;
  justify-content: center;
}

.expression-input {
  display: flex;
  align-items: center;
}

.range-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
}
</style>