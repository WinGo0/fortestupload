<template>
  <div class="node-container">
    <div v-if="node.nodeType === 'LOGIC_NODE'" class="rule-group-container">
      <div v-if="node.children && node.children.length > 1" class="connector-area">
        <el-button type="primary" circle @click="handleToggle">
          {{ node.logicOperator === 'AND' ? '且' : '或' }}
        </el-button>
        <div class="vertical-line-filler"></div>
        <el-button type="primary" plain circle @click="handleAddRule">+</el-button>
      </div>

      <div class="rows-area">
        <div v-for="(childNode, index) in node.children" :key="index">
          <RuleNodeNew
            :node="childNode"
            :path="[...path, index]"
            :is-in-group="node.children.length > 1"
            @promote-to-group="emit('promote-to-group', $event)"
            @add-rule-to-group="emit('add-rule-to-group', $event)"
            @remove-node="emit('remove-node', $event)"
            @toggle-operator="emit('toggle-operator', $event)"
            @update-node-value="emit('update-node-value', $event)"
            @open-param-select="emit('open-param-select', $event)"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="node.nodeType === 'CONDITION_NODE'"
      class="row-item"
      :class="{ 'is-in-group': isInGroup }"
    >
      <div class="input-with-buttons-container">
        <div class="structured-rule-container">
          <el-select
            v-model="exprTypeModel"
            placeholder="选择类型"
            style="width: 110px"
            size="large"
          >
            <el-option label="当前值" value="REAL_TIME" />
            <el-option label="变化率" value="CHANGE_RATE" />
            <el-option label="变化幅度" value="CHANGE_AMOUNT" />
            <el-option label="开关量" value="SWITCH" />
          </el-select>

          <el-input
            v-model="parameterModel"
            placeholder="请选择参数"
            readonly
            size="large"
            style="width: 180px"
          >
            <template #append>
              <el-button @click.stop="handleOpenParam">🔍</el-button>
            </template>
          </el-input>

          <template v-if="exprTypeModel === 'CHANGE_AMOUNT'">
            <span class="prefix-text">在</span>
            <el-input-number
              v-model="timeValueModel"
              :controls="false"
              :min="1"
              :precision="0"
              :max="timeMax"
              size="large"
              style="width: 60px"
            />
            <el-select v-model="timeUnitModel" style="width: 70px" size="large">
              <el-option label="秒" value="SECOND" />
              <el-option label="分" value="MINUTE" />
              <el-option label="时" value="HOUR" />
              <el-option label="日" value="DAY" />
            </el-select>
            <span class="prefix-text">内，|E末 - E初|</span>
            <el-select
              v-model="operatorModel"
              placeholder="符号"
              style="width: 80px"
              size="large"
            >
              <el-option label=">" value="GT" />
              <el-option label="<" value="LT" />
              <el-option label="=" value="EQ" />
              <el-option label=">=" value="GTE" />
              <el-option label="<=" value="LTE" />
            </el-select>
            <el-input-number
              v-model="comparisonValueModel"
              :controls="false"
              placeholder="阈值"
              size="large"
              style="width: 100px"
            />
            <span class="prefix-text">进入工况段</span>
          </template>

          <template v-else-if="exprTypeModel === 'SWITCH'">
            <span class="prefix-text">开:</span>
            <el-input-number
              v-model="openRangeStartModel"
              :controls="false"
              placeholder="下限"
              size="large"
              style="width: 80px"
            />
            <span class="prefix-text">—</span>
            <el-input-number
              v-model="openRangeEndModel"
              :controls="false"
              placeholder="上限"
              size="large"
              style="width: 80px"
            />

            <span class="prefix-text" style="margin-left: 10px">关:</span>
            <el-input-number
              v-model="closeRangeStartModel"
              :controls="false"
              placeholder="下限"
              size="large"
              style="width: 80px"
            />
            <span class="prefix-text">—</span>
            <el-input-number
              v-model="closeRangeEndModel"
              :controls="false"
              placeholder="上限"
              size="large"
              style="width: 80px"
            />

            <div style="flex-basis: 100%; height: 0"></div>

            <span class="prefix-text">当为</span>
            <el-select
              v-model="targetStateModel"
              placeholder="请选择"
              style="width: 80px"
              size="large"
            >
              <el-option label="开" :value="1" />
              <el-option label="关" :value="0" />
            </el-select>
            <span class="prefix-text">时，持续</span>

            <el-input-number
              v-model="timeValueModel"
              :controls="false"
              :min="1"
              :precision="0"
              :max="timeMax"
              size="large"
              style="width: 60px"
            />
            <el-select v-model="timeUnitModel" style="width: 70px" size="large">
              <el-option label="秒" value="SECOND" />
              <el-option label="分" value="MINUTE" />
              <el-option label="时" value="HOUR" />
              <el-option label="日" value="DAY" />
            </el-select>

            <span class="prefix-text">进入工况段</span>
          </template>

          <template v-else>
            <template v-if="exprTypeModel === 'CHANGE_RATE'">
              <span class="prefix-text">在</span>
              <el-input-number
                v-model="timeValueModel"
                :controls="false"
                :min="1"
                :precision="0"
                :max="timeMax"
                size="large"
                style="width: 60px"
              />
              <el-select v-model="timeUnitModel" style="width: 70px" size="large">
                <el-option label="秒" value="SECOND" />
                <el-option label="分" value="MINUTE" />
                <el-option label="时" value="HOUR" />
                <el-option label="日" value="DAY" />
              </el-select>
              <span class="prefix-text">内，变化率</span>
            </template>
            <template v-else>
              <span class="prefix-text">的当前值处于</span>
            </template>

            <el-select
              v-model="operatorModel"
              placeholder="符号"
              style="width: 80px"
              size="large"
            >
              <el-option label=">" value="GT" />
              <el-option label="<" value="LT" />
              <el-option label="=" value="EQ" />
              <el-option label=">=" value="GTE" />
              <el-option label="<=" value="LTE" />
            </el-select>
            <el-input-number
              v-model="comparisonValueModel"
              :controls="false"
              placeholder="阈值"
              size="large"
              style="width: 100px"
            />
          </template>
        </div>

        <div class="action-buttons">
          <el-button type="primary" circle @click="handlePromote">+</el-button>
          <el-button type="danger" circle @click="handleRemove">-</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'RuleNodeNew'
})

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  path: {
    type: Array,
    required: true
  },
  isInGroup: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'promote-to-group',
  'add-rule-to-group',
  'remove-node',
  'toggle-operator',
  'update-node-value',
  'open-param-select'
])

const emitRuleUpdate = (field, value) => {
  emit('update-node-value', { path: props.path, field, value })
}

const exprTypeModel = computed({
  get: () => props.node?.type ?? 'REAL_TIME',
  set: (value) => emitRuleUpdate('type', value)
})

const parameterModel = computed({
  get: () => props.node?.paramCode ?? '',
  set: (value) => emitRuleUpdate('paramCode', value)
})

const operatorModel = computed({
  get: () => props.node?.operator ?? 'GT',
  set: (value) => emitRuleUpdate('operator', value)
})

const comparisonValueModel = computed({
  get: () => props.node?.threshold ?? null,
  set: (value) => emitRuleUpdate('threshold', value)
})

const timeValueModel = computed({
  get: () => props.node?.timeValue ?? 1,
  set: (value) => emitRuleUpdate('timeValue', value)
})

const timeUnitModel = computed({
  get: () => props.node?.timeUnit ?? 'SECOND',
  set: (value) => {
    emitRuleUpdate('timeUnit', value)

    const limits = { SECOND: 59, MINUTE: 59, HOUR: 24, DAY: 2 }
    const timeValue = props.node?.timeValue

    if (timeValue != null && limits[value] != null && timeValue > limits[value]) {
      emitRuleUpdate('timeValue', limits[value])
    }
  }
})

const targetStateModel = computed({
  get: () => props.node?.targetState ?? 1,
  set: (value) => emitRuleUpdate('targetState', value)
})

const openRangeStartModel = computed({
  get: () => props.node?.openRangeStart ?? null,
  set: (value) => emitRuleUpdate('openRangeStart', value)
})

const openRangeEndModel = computed({
  get: () => props.node?.openRangeEnd ?? null,
  set: (value) => emitRuleUpdate('openRangeEnd', value)
})

const closeRangeStartModel = computed({
  get: () => props.node?.closeRangeStart ?? null,
  set: (value) => emitRuleUpdate('closeRangeStart', value)
})

const closeRangeEndModel = computed({
  get: () => props.node?.closeRangeEnd ?? null,
  set: (value) => emitRuleUpdate('closeRangeEnd', value)
})

const timeMax = computed(() => {
  const unit = props.node?.timeUnit

  if (unit === 'HOUR') return 24
  if (unit === 'DAY') return 2
  if (unit === 'MINUTE' || unit === 'SECOND') return 59
  return undefined
})

const handlePromote = () => {
  emit('promote-to-group', props.path)
}

const handleRemove = () => {
  emit('remove-node', props.path)
}

const handleAddRule = () => {
  emit('add-rule-to-group', props.path)
}

const handleToggle = () => {
  emit('toggle-operator', props.path)
}

const handleOpenParam = () => {
  emit('open-param-select', props.path)
}
</script>

<style scoped>
.node-container {
  width: 100%;
}

.rule-group-container {
  display: flex;
  padding: 12px;
  margin-top: 8px;
  background-color: rgba(64, 158, 255, 0.05);
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.connector-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 15px;
}

.vertical-line-filler {
  flex-grow: 1;
  width: 2px;
  margin: 8px 0;
  background-color: #409eff;
}

.rows-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.row-item {
  width: 100%;
}

.row-item.is-in-group {
  position: relative;
  padding-left: 20px;
}

.row-item.is-in-group::before {
  position: absolute;
  top: 20px;
  left: 0;
  width: 20px;
  height: 2px;
  content: '';
  background-color: #409eff;
  transform: translateY(-50%);
}

.input-with-buttons-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.structured-rule-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.prefix-text {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}
</style>
