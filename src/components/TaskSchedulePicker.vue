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
            @change="syncCron"
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
            @change="syncCron"
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
          <el-input-number
            v-model="schedule.intervalHours"
            :min="0"
            :max="999"
            :controls="false"
            placeholder="00"
            @change="syncCron"
          />
          <span class="unit">时</span>
          <el-input-number
            v-model="schedule.intervalMinutes"
            :min="0"
            :max="59"
            :controls="false"
            placeholder="00"
            @change="syncCron"
          />
          <span class="unit">分</span>
          <el-input-number
            v-model="schedule.intervalSeconds"
            :min="0"
            :max="59"
            :controls="false"
            placeholder="00"
            @change="syncCron"
          />
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
          @change="syncCron"
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
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  FREQUENCY,
  weekDayOptions,
  cronToSchedule,
  scheduleToCron,
  formatFrequency,
  formatExecutionTime,
  calcNextExecutionTime
} from '../utils/taskSchedule.js'

const frequencyOptions = [
  { label: '间隔', value: FREQUENCY.INTERVAL },
  { label: '每天', value: FREQUENCY.DAILY },
  { label: '每周', value: FREQUENCY.WEEKLY },
  { label: '每月', value: FREQUENCY.MONTHLY }
]

const props = defineProps({
  /** 接口字段：Quartz 6 位 Cron 表达式 */
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

/** 内部 UI 状态，与 Cron 双向同步 */
const schedule = ref(cronToSchedule(props.modelValue))

const isInterval = computed(() => schedule.value.frequencyType === FREQUENCY.INTERVAL)

const cronExpression = computed(() => scheduleToCron(schedule.value))
const frequencyDisplay = computed(() => formatFrequency(schedule.value))
const executionTimeDisplay = computed(() => formatExecutionTime(schedule.value))
const nextExecutionTime = computed(() => calcNextExecutionTime(schedule.value))

/** 配置变更 → 生成 Cron 并 emit（提交接口用这个值） */
function syncCron() {
  const cron = scheduleToCron(schedule.value)
  if (cron !== props.modelValue) {
    emit('update:modelValue', cron)
    emit('change', cron)
  }
}

function onFrequencyChange(type) {
  if (type === FREQUENCY.WEEKLY && !schedule.value.weekDays.length) {
    schedule.value.weekDays = [1]
  }
  if (type === FREQUENCY.MONTHLY && !schedule.value.monthDays.length) {
    schedule.value.monthDays = [1]
  }
  syncCron()
}

/** 外部传入 Cron（编辑回显）→ 解析为 UI 配置 */
watch(
  () => props.modelValue,
  (cron) => {
    if (!cron) return
    const parsed = cronToSchedule(cron)
    const currentCron = scheduleToCron(schedule.value)
    if (cron !== currentCron) {
      schedule.value = parsed
    }
  }
)
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
</style>
