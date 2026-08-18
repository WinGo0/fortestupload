const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const STATUS_TEXT = {
  normal: '正常',
  warning: '预警',
  alarm: '告警',
  offline: '离线'
}

const LEVEL_TEXT = {
  critical: '严重',
  major: '主要',
  warning: '提示'
}

const DEVICE_PREFIX = ['A区', 'B区', 'C区', 'D区']

const ALARM_MESSAGES = [
  '温度超过阈值，请检查冷却系统',
  '压力波动异常，已触发预警',
  '流量低于设定下限',
  '液位接近上限，建议开启排液',
  '设备通讯中断，正在尝试重连',
  '运行负载持续偏高',
  '备用电源切换完成',
  '传感器数据延迟超过 3 秒'
]

export function statusText(status) {
  return STATUS_TEXT[status] || status
}

export function levelText(level) {
  return LEVEL_TEXT[level] || level
}

export function formatTime(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function createStats() {
  return {
    items: [
      {
        key: 'online',
        label: '在线设备',
        value: randInt(82, 98),
        unit: '台',
        color: '#2dd4bf',
        delta: '+2'
      },
      {
        key: 'alarm',
        label: '当前告警',
        value: randInt(2, 14),
        unit: '条',
        color: '#fb7185',
        delta: '-1'
      },
      {
        key: 'load',
        label: '平均负载',
        value: randInt(55, 82),
        unit: '%',
        color: '#fbbf24',
        delta: '+1.2'
      },
      {
        key: 'flow',
        label: '实时流量',
        value: randInt(320, 760),
        unit: 'MB/s',
        color: '#22d3ee',
        delta: '+8'
      }
    ],
    trend: Array.from({ length: 14 }, () => randInt(28, 96))
  }
}

export function createMosaic() {
  return Array.from({ length: 72 }, (_, index) => {
    const roll = Math.random()
    const status = roll > 0.97
      ? 'offline'
      : roll > 0.9
        ? 'alarm'
        : roll > 0.78
          ? 'warning'
          : 'normal'

    return {
      id: `mosaic-${Date.now()}-${index}`,
      index,
      name: `${DEVICE_PREFIX[index % DEVICE_PREFIX.length]}-${String(index + 1).padStart(2, '0')}`,
      status
    }
  })
}

export function createAlarmList() {
  const count = randInt(8, 12)
  const levels = ['critical', 'major', 'warning']

  return Array.from({ length: count }, (_, index) => ({
    id: `alarm-${Date.now()}-${index}`,
    time: formatTime(new Date(Date.now() - index * randInt(15, 160) * 1000)),
    device: `${DEVICE_PREFIX[index % DEVICE_PREFIX.length]}-${String(randInt(1, 20)).padStart(2, '0')}`,
    level: levels[randInt(0, levels.length - 1)],
    message: ALARM_MESSAGES[randInt(0, ALARM_MESSAGES.length - 1)]
  }))
}

export function createDashboardSnapshot() {
  return {
    stats: createStats(),
    mosaic: createMosaic(),
    alarms: createAlarmList()
  }
}

export function normalizeDashboard(data = {}) {
  const fallback = createDashboardSnapshot()

  return {
    stats: data.stats || fallback.stats,
    mosaic: Array.isArray(data.mosaic) ? data.mosaic : fallback.mosaic,
    alarms: Array.isArray(data.alarms)
      ? data.alarms
      : Array.isArray(data.list)
        ? data.list
        : fallback.alarms
  }
}
