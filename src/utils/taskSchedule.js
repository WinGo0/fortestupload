import dayjs from 'dayjs'

/** 频率类型 */
export const FREQUENCY = {
  INTERVAL: 'interval',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
}

/** Quartz 6 位：秒 分 时 日 月 周 */
export const CRON_FIELDS = 6

export const weekDayOptions = [
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

/** dayjs(0=周日) → Quartz(1=周日) */
function toQuartzWeekDay(dayjsDay) {
  return dayjsDay + 1
}

/** Quartz(1=周日) → dayjs(0=周日) */
function fromQuartzWeekDay(quartzDay) {
  return quartzDay - 1
}

export function createDefaultSchedule() {
  return {
    frequencyType: FREQUENCY.DAILY,
    weekDays: [],
    monthDays: [],
    intervalHours: 0,
    intervalMinutes: 30,
    intervalSeconds: 0,
    fixedTime: '08:00:00'
  }
}

/** 默认 Cron：每天 08:00:00（Quartz 6 位） */
export function createDefaultCron() {
  return '0 0 8 * * ?'
}

const DEFAULT_CRON = createDefaultCron()

function parseFixedTime(fixedTime) {
  const [h = 0, m = 0, s = 0] = (fixedTime || '08:00:00').split(':').map(Number)
  return { h, m, s }
}

function padTime(h, m, s) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * UI 配置 → Quartz Cron（6 位：秒 分 时 日 月 周）
 */
export function scheduleToCron(config) {
  if (!config?.frequencyType) return DEFAULT_CRON

  // 间隔：优先整小时 → 整分钟 → 秒
  if (config.frequencyType === FREQUENCY.INTERVAL) {
    const totalSec =
      (config.intervalHours ?? 0) * 3600 +
      (config.intervalMinutes ?? 0) * 60 +
      (config.intervalSeconds ?? 0)

    if (totalSec <= 0) return '0/30 * * * * ?'

    if (totalSec % 3600 === 0) {
      const hours = totalSec / 3600
      return `0 0 0/${hours} * * ?`
    }
    if (totalSec % 60 === 0) {
      const minutes = totalSec / 60
      return `0 0/${minutes} * * * ?`
    }
    return `0/${totalSec} * * * * ?`
  }

  const { h, m, s } = parseFixedTime(config.fixedTime)

  if (config.frequencyType === FREQUENCY.DAILY) {
    return `${s} ${m} ${h} * * ?`
  }

  if (config.frequencyType === FREQUENCY.WEEKLY) {
    const days = [...(config.weekDays || [])]
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map(toQuartzWeekDay)
      .join(',')
    return `${s} ${m} ${h} ? * ${days || '2'}`
  }

  if (config.frequencyType === FREQUENCY.MONTHLY) {
    const days = [...(config.monthDays || [])].sort((a, b) => a - b).join(',')
    return `${s} ${m} ${h} ${days || '1'} * ?`
  }

  return DEFAULT_CRON
}

/** 解析 Cron 步长字段，如 0/30 → 30 */
function parseStep(field) {
  if (!field || !field.includes('/')) return null
  const [, step] = field.split('/')
  const n = Number(step)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** 解析逗号分隔数字列表 */
function parseNumberList(field) {
  if (!field || field === '*' || field === '?') return []
  return field
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n))
}

/**
 * Quartz Cron → UI 配置（用于编辑回显）
 */
export function cronToSchedule(cron) {
  if (!cron || typeof cron !== 'string') return createDefaultSchedule()

  const parts = cron.trim().split(/\s+/)
  if (parts.length < CRON_FIELDS) return createDefaultSchedule()

  const [sec, min, hour, dom, , dow] = parts

  // 间隔 - 秒级：0/N * * * * ?
  if (sec.includes('/') && min === '*' && hour === '*') {
    const step = parseStep(sec)
    if (step) {
      return {
        frequencyType: FREQUENCY.INTERVAL,
        weekDays: [],
        monthDays: [],
        intervalHours: 0,
        intervalMinutes: 0,
        intervalSeconds: step,
        fixedTime: '08:00:00'
      }
    }
  }

  // 间隔 - 分钟级：0 0/N * * * ?
  if (min.includes('/') && hour === '*' && dom === '*') {
    const step = parseStep(min)
    if (step) {
      const totalMin = step
      return {
        frequencyType: FREQUENCY.INTERVAL,
        weekDays: [],
        monthDays: [],
        intervalHours: Math.floor(totalMin / 60),
        intervalMinutes: totalMin % 60,
        intervalSeconds: 0,
        fixedTime: '08:00:00'
      }
    }
  }

  // 间隔 - 小时级：0 0 0/N * * ?
  if (hour.includes('/') && dom === '*') {
    const step = parseStep(hour)
    if (step) {
      return {
        frequencyType: FREQUENCY.INTERVAL,
        weekDays: [],
        monthDays: [],
        intervalHours: step,
        intervalMinutes: 0,
        intervalSeconds: 0,
        fixedTime: '08:00:00'
      }
    }
  }

  const h = Number(hour)
  const m = Number(min)
  const s = Number(sec)
  const fixedTime = padTime(
    Number.isFinite(h) ? h : 8,
    Number.isFinite(m) ? m : 0,
    Number.isFinite(s) ? s : 0
  )

  // 每周：日=? 且 周有值
  if ((dom === '?' || dom === '*') && dow !== '?' && dow !== '*') {
    const weekDays = parseNumberList(dow).map(fromQuartzWeekDay)
    return {
      frequencyType: FREQUENCY.WEEKLY,
      weekDays,
      monthDays: [],
      intervalHours: 0,
      intervalMinutes: 30,
      intervalSeconds: 0,
      fixedTime
    }
  }

  // 每月：日有具体值 且 周=?
  if (dom !== '*' && dom !== '?' && (dow === '?' || dow === '*')) {
    const monthDays = parseNumberList(dom)
    return {
      frequencyType: FREQUENCY.MONTHLY,
      weekDays: [],
      monthDays,
      intervalHours: 0,
      intervalMinutes: 30,
      intervalSeconds: 0,
      fixedTime
    }
  }

  // 每天：日=* 周=?
  return {
    frequencyType: FREQUENCY.DAILY,
    weekDays: [],
    monthDays: [],
    intervalHours: 0,
    intervalMinutes: 30,
    intervalSeconds: 0,
    fixedTime
  }
}

export function formatFrequency(config) {
  const map = {
    [FREQUENCY.INTERVAL]: '间隔',
    [FREQUENCY.DAILY]: '每天',
    [FREQUENCY.WEEKLY]: '每周',
    [FREQUENCY.MONTHLY]: '每月'
  }
  const base = map[config.frequencyType] || ''

  if (config.frequencyType === FREQUENCY.WEEKLY && config.weekDays?.length) {
    const days = [...config.weekDays]
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map((d) => weekDayLabelMap[d])
      .join('、')
    return `${base}（${days}）`
  }

  if (config.frequencyType === FREQUENCY.MONTHLY && config.monthDays?.length) {
    const days = [...config.monthDays].sort((a, b) => a - b).join('、')
    return `${base}（${days}日）`
  }

  return base
}

export function formatExecutionTime(config) {
  if (config.frequencyType === FREQUENCY.INTERVAL) {
    const h = config.intervalHours ?? 0
    const m = config.intervalMinutes ?? 0
    const s = config.intervalSeconds ?? 0
    return `每 ${h} 时 ${m} 分 ${s} 秒`
  }
  return (config.fixedTime || '08:00:00').slice(0, 8)
}

/** 从 Cron 直接格式化展示（列表页用） */
export function formatFrequencyFromCron(cron) {
  return formatFrequency(cronToSchedule(cron))
}

export function formatExecutionTimeFromCron(cron) {
  return formatExecutionTime(cronToSchedule(cron))
}

function getIntervalMs(config) {
  const h = config.intervalHours ?? 0
  const m = config.intervalMinutes ?? 0
  const s = config.intervalSeconds ?? 0
  return (h * 3600 + m * 60 + s) * 1000
}

function applyFixedTime(base, fixedTime) {
  const [h, m, s] = (fixedTime || '08:00:00').split(':').map(Number)
  return base.hour(h).minute(m).second(s).millisecond(0)
}

export function calcNextExecutionTime(config, from = dayjs()) {
  if (!config?.frequencyType) return null

  if (config.frequencyType === FREQUENCY.INTERVAL) {
    const ms = getIntervalMs(config)
    if (ms <= 0) return null
    return from.add(ms, 'millisecond').format('YYYY-MM-DD HH:mm:ss')
  }

  const time = config.fixedTime || '08:00:00'

  if (config.frequencyType === FREQUENCY.DAILY) {
    let next = applyFixedTime(from, time)
    if (!next.isAfter(from)) next = next.add(1, 'day')
    return next.format('YYYY-MM-DD HH:mm:ss')
  }

  if (config.frequencyType === FREQUENCY.WEEKLY) {
    const days = config.weekDays
    if (!days?.length) return null
    for (let i = 0; i < 8; i++) {
      const candidate = from.add(i, 'day')
      if (days.includes(candidate.day())) {
        const at = applyFixedTime(candidate, time)
        if (at.isAfter(from)) return at.format('YYYY-MM-DD HH:mm:ss')
      }
    }
    return null
  }

  if (config.frequencyType === FREQUENCY.MONTHLY) {
    const days = [...(config.monthDays || [])].sort((a, b) => a - b)
    if (!days.length) return null
    for (let monthOffset = 0; monthOffset < 14; monthOffset++) {
      const monthStart = from.startOf('month').add(monthOffset, 'month')
      for (const day of days) {
        const candidate = monthStart.date(day)
        if (candidate.month() !== monthStart.month()) continue
        const at = applyFixedTime(candidate, time)
        if (at.isAfter(from)) return at.format('YYYY-MM-DD HH:mm:ss')
      }
    }
    return null
  }

  return null
}

export function calcNextExecutionTimeFromCron(cron, from = dayjs()) {
  return calcNextExecutionTime(cronToSchedule(cron), from)
}

export function validateSchedule(config) {
  if (!config?.frequencyType) return '请选择频率'

  if (config.frequencyType === FREQUENCY.INTERVAL && getIntervalMs(config) <= 0) {
    return '间隔时间不能为 0'
  }
  if (config.frequencyType === FREQUENCY.WEEKLY && !config.weekDays?.length) {
    return '请选择星期'
  }
  if (config.frequencyType === FREQUENCY.MONTHLY && !config.monthDays?.length) {
    return '请选择日期'
  }
  if (config.frequencyType !== FREQUENCY.INTERVAL && !config.fixedTime) {
    return '请选择执行时间'
  }
  return ''
}
