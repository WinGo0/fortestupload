<template>
  <div class="task-schedule-picker">
    <el-form :model="schedule" label-width="100px" label-position="right">
      <!-- 频率 -->
      <el-form-item label="频率:" required>
        <div class="frequency-row">
          <el-select
            v-model="schedule.frequencyType"
            placeholder="请选择频率"
            style="width: 160px"
            @change="onFrequencyChange"
          >
            <el-option
              v-for="item in frequencyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-select
            v-if="schedule.frequencyType === 'weekly'"
            v-model="schedule.weekDays"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择星期"
            style="width: 280px; margin-left: 12px"
          >
            <el-option
              v-for="item in weekDayOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-select
            v-if="schedule.frequencyType === 'monthly'"
            v-model="schedule.monthDays"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择日期"
            style="width: 280px; margin-left: 12px"
          >
            <el-option
              v-for="day in 31"
              :key="day"
              :label="`${day}日`"
              :value="day"
            />
          </el-select>
        </div>
      </el-form-item>

      <!-- 间隔：时/分/秒 -->
      <el-form-item v-if="isInterval" label="执行时间:" required>
        <div class="interval-time-row">
          <el-input-number v-model="schedule.intervalHours" :min="0" :max="999" :controls="false" placeholder="00" />
          <span class="unit">时</span>
          <el-input-number v-model="schedule.intervalMinutes" :min="0" :max="59" :controls="false" placeholder="00" />
          <span class="unit">分</span>
          <el-input-number v-model="schedule.intervalSeconds" :min="0" :max="59" :controls="false" placeholder="00" />
          <span class="unit">秒</span>
          <span class="hint">每隔上述时间执行一次</span>
        </div>
      </el-form-item>

      <!-- 固定时刻 -->
      <el-form-item v-else label="执行时间:" required>
        <el-time-picker
          v-model="schedule.fixedTime"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
          placeholder="选择时刻"
          style="width: 160px"
        />
      </el-form-item>
    </el-form>

    <!-- 预览 -->
    <div class="preview-panel">
      <div class="preview-item">
        <span class="preview-label">频率展示：</span>
        <span>{{ frequencyDisplay }}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">执行时间展示：</span>
        <span>{{ executionTimeDisplay }}</span>
      </div>
      <div class="preview-item cron-row">
        <span class="preview-label">Cron 表达式：</span>
        <code class="cron-code">{{ cronExpression }}</code>
      </div>
      <div class="preview-item">
        <span class="preview-label">下次执行时间：</span>
        <span class="next-time">{{ nextExecutionTime || '—' }}</span>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-row">
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'

// ============ 常量定义 ============
const FREQUENCY = {
  INTERVAL: 'interval',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
}

const weekDayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 }
]

const weekDayLabelMap = Object.fromEntries(
  weekDayOptions.map(({ label, value }) => [value, label])
)

const frequencyOptions = [
  { label: '间隔', value: FREQUENCY.INTERVAL },
  { label: '每天', value: FREQUENCY.DAILY },
  { label: '每周', value: FREQUENCY.WEEKLY },
  { label: '每月', value: FREQUENCY.MONTHLY }
]

// ============ Props ============
const props = defineProps({
  /** 表单配置对象（新增/编辑时直接传入） */
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

// ============ 状态 ============
const defaultSchedule = {
  frequencyType: FREQUENCY.DAILY,
  weekDays: [],
  monthDays: [],
  intervalHours: 0,
  intervalMinutes: 30,
  intervalSeconds: 0,
  fixedTime: '08:00:00'
}

const schedule = ref({ ...defaultSchedule })

const isInterval = computed(() => schedule.value.frequencyType === FREQUENCY.INTERVAL)

// ============ Cron 生成 ============
const cronExpression = computed(() => {
  const c = schedule.value

  // 间隔：限制单一单位，确保 Quartz cron 行为正确
  if (c.frequencyType === FREQUENCY.INTERVAL) {
    const h = c.intervalHours ?? 0
    const m = c.intervalMinutes ?? 0
    const s = c.intervalSeconds ?? 0

    if (h > 0 && h <= 23) return `0 0 0/${h} * * ?`
    if (m > 0 && m <= 59) return `0 0/${m} * * * ?`
    if (s > 0 && s <= 59) return `0/${s} * * * * ?`

    // fallback：默认每 30 分钟
    return '0 0/30 * * * ?'
  }

  const [h = 8, m = 0, s = 0] = (c.fixedTime || '08:00:00').split(':').map(Number)

  if (c.frequencyType === FREQUENCY.DAILY) return `${s} ${m} ${h} * * ?`

  if (c.frequencyType === FREQUENCY.WEEKLY) {
    const days = [...(c.weekDays || [])]
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(d => d + 1) // dayjs(0=周日) → Quartz(1=周日)
      .join(',')
    return `${s} ${m} ${h} ? * ${days || '2'}`
  }

  if (c.frequencyType === FREQUENCY.MONTHLY) {
    const days = [...(c.monthDays || [])].sort((a, b) => a - b).join(',')
    return `${s} ${m} ${h} ${days || '1'} * ?`
  }

  return '0 0 8 * * ?'
})

// ============ 展示文案 ============
const frequencyDisplay = computed(() => {
  const map = { [FREQUENCY.INTERVAL]: '间隔', [FREQUENCY.DAILY]: '每天', [FREQUENCY.WEEKLY]: '每周', [FREQUENCY.MONTHLY]: '每月' }
  const base = map[schedule.value.frequencyType] || ''

  if (schedule.value.frequencyType === FREQUENCY.WEEKLY && schedule.value.weekDays?.length) {
    const days = [...schedule.value.weekDays]
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(d => weekDayLabelMap[d])
      .join('、')
    return `${base}（${days}）`
  }

  if (schedule.value.frequencyType === FREQUENCY.MONTHLY && schedule.value.monthDays?.length) {
    const days = [...schedule.value.monthDays].sort((a, b) => a - b).join('、')
    return `${base}（${days}日）`
  }

  return base
})

const executionTimeDisplay = computed(() => {
  if (schedule.value.frequencyType === FREQUENCY.INTERVAL) {
    const h = schedule.value.intervalHours ?? 0
    const m = schedule.value.intervalMinutes ?? 0
    const s = schedule.value.intervalSeconds ?? 0
    if (h > 0) return `每隔 ${h} 小时`
    if (m > 0) return `每隔 ${m} 分钟`
    if (s > 0) return `每隔 ${s} 秒`
    return '每隔 30 分钟'
  }
  return (schedule.value.fixedTime || '08:00:00').slice(0, 8)
})

// ============ 下次执行时间 ============
const nextExecutionTime = computed(() => {
  const c = schedule.value
  const now = dayjs()

  if (c.frequencyType === FREQUENCY.INTERVAL) {
    const h = c.intervalHours ?? 0
    const m = c.intervalMinutes ?? 0
    const s = c.intervalSeconds ?? 0
    let ms = 0
    if (h > 0) ms = h * 3600 * 1000
    else if (m > 0) ms = m * 60 * 1000
    else if (s > 0) ms = s * 1000
    else ms = 30 * 60 * 1000 // 默认 30 分钟
    return now.add(ms, 'millisecond').format('YYYY-MM-DD HH:mm:ss')
  }

  const [h = 8, m = 0, s = 0] = (c.fixedTime || '08:00:00').split(':').map(Number)
  const applyTime = (base) => base.hour(h).minute(m).second(s).millisecond(0)

  if (c.frequencyType === FREQUENCY.DAILY) {
    let next = applyTime(now)
    if (!next.isAfter(now)) next = next.add(1, 'day')
    return next.format('YYYY-MM-DD HH:mm:ss')
  }

  if (c.frequencyType === FREQUENCY.WEEKLY) {
    const days = c.weekDays
    if (!days?.length) return null
    for (let i = 0; i < 8; i++) {
      const candidate = now.add(i, 'day')
      if (days.includes(candidate.day())) {
        const at = applyTime(candidate)
        if (at.isAfter(now)) return at.format('YYYY-MM-DD HH:mm:ss')
      }
    }
    return null
  }

  if (c.frequencyType === FREQUENCY.MONTHLY) {
    const days = [...(c.monthDays || [])].sort((a, b) => a - b)
    if (!days.length) return null
    for (let offset = 0; offset < 14; offset++) {
      const monthStart = now.startOf('month').add(offset, 'month')
      for (const day of days) {
        const candidate = monthStart.date(day)
        if (candidate.month() !== monthStart.month()) continue
        const at = applyTime(candidate)
        if (at.isAfter(now)) return at.format('YYYY-MM-DD HH:mm:ss')
      }
    }
    return null
  }

  return null
})

// ============ 校验 ============
function validate() {
  const c = schedule.value
  if (!c.frequencyType) return '请选择频率'

  if (c.frequencyType === FREQUENCY.INTERVAL) {
    const h = c.intervalHours ?? 0
    const m = c.intervalMinutes ?? 0
    const s = c.intervalSeconds ?? 0

    const activeCount = [h, m, s].filter(v => v > 0).length
    if (activeCount === 0) return '间隔时间不能为 0'
    if (activeCount > 1) return '间隔时间只能设置一个单位（时/分/秒）'
    if (h > 23) return '小时间隔不能超过 23'
    if (m > 59) return '分钟间隔不能超过 59'
    if (s > 59) return '秒间隔不能超过 59'
  }

  if (c.frequencyType === FREQUENCY.WEEKLY && !c.weekDays?.length) return '请选择星期'
  if (c.frequencyType === FREQUENCY.MONTHLY && !c.monthDays?.length) return '请选择日期'
  if (c.frequencyType !== FREQUENCY.INTERVAL && !c.fixedTime) return '请选择执行时间'
  return ''
}

// ============ 事件 ============
function onFrequencyChange(type) {
  // 切换频率时清理不相关的数据，避免脏数据残留
  if (type !== FREQUENCY.WEEKLY) schedule.value.weekDays = []
  if (type !== FREQUENCY.MONTHLY) schedule.value.monthDays = []

  if (type === FREQUENCY.WEEKLY && !schedule.value.weekDays.length) schedule.value.weekDays = [1]
  if (type === FREQUENCY.MONTHLY && !schedule.value.monthDays.length) schedule.value.monthDays = [1]
}

function handleSubmit() {
  const err = validate()
  if (err) {
    // 这里可以用 ElMessage.error(err) 或其他提示方式
    console.error(err)
    return
  }
  // 在组件内部处理提交，不 emit 给父组件
  console.log('表单数据:', { ...schedule.value })
  console.log('Cron 表达式:', cronExpression.value)
}

// ============ Interval 输入框联动：只能设置一个单位 ============
watch(
  () => [schedule.value.intervalHours, schedule.value.intervalMinutes, schedule.value.intervalSeconds],
  ([newH, newM, newS], [oldH, oldM, oldS]) => {
    if (newH !== oldH && newH > 0) {
      schedule.value.intervalMinutes = 0
      schedule.value.intervalSeconds = 0
    } else if (newM !== oldM && newM > 0) {
      schedule.value.intervalHours = 0
      schedule.value.intervalSeconds = 0
    } else if (newS !== oldS && newS > 0) {
      schedule.value.intervalHours = 0
      schedule.value.intervalMinutes = 0
    }
  }
)

// ============ 回显（直接用表单对象，不再解析 Cron） ============
watch(() => props.modelValue, (val) => {
  if (!val || typeof val !== 'object') return
  schedule.value = { ...defaultSchedule, ...val }
}, { immediate: true, deep: true })
</script>

<style scoped>
.task-schedule-picker {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.frequency-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.interval-time-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.interval-time-row :deep(.el-input-number) {
  width: 72px;
}

.unit {
  margin-right: 12px;
  color: #606266;
}

.hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.preview-panel {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
}

.preview-item {
  line-height: 28px;
  color: #303133;
}

.preview-label {
  color: #909399;
  margin-right: 8px;
}

.cron-row {
  display: flex;
  align-items: center;
}

.cron-code {
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
}

.next-time {
  color: #409eff;
  font-weight: 500;
}

.submit-row {
  margin-top: 20px;
  text-align: right;
}
</style>