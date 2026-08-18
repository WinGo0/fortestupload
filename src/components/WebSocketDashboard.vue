<template>
  <section class="dashboard-panel socketio-panel">
    <header class="panel-header">
      <div class="title-block">
        <p class="eyebrow">改后组件</p>
        <h2>Socket.IO 推送 Dashboard</h2>
      </div>
      <div class="header-meta">
        <span class="mode-tag socketio">Socket.IO 推送</span>
        <span class="meta-item">
          <i class="status-dot" :class="`state-${connectionState}`"></i>
          {{ connectionStatus }}
        </span>
        <span class="socket-label" :title="socketLabel">{{ socketLabel }}</span>
      </div>
    </header>

    <div class="dashboard-grid">
      <div class="panel stats-panel">
        <div class="panel-title">
          <span>统计总览</span>
          <span class="endpoint-tag">Socket.IO event: stats</span>
        </div>
        <div class="stats-grid">
          <div class="stat-item" v-for="item in stats.items" :key="item.key">
            <span class="stat-label">{{ item.label }}</span>
            <div class="stat-main">
              <strong class="stat-value" :style="{ color: item.color }">{{ item.value }}</strong>
              <span class="stat-unit">{{ item.unit }}</span>
            </div>
            <span class="stat-delta" :class="deltaClass(item.delta)">{{ item.delta }}</span>
          </div>
        </div>
        <div class="trend-chart" aria-label="统计趋势">
          <div
            v-for="(point, index) in stats.trend"
            :key="index"
            class="trend-bar"
            :style="{ height: `${point}%`, animationDelay: `${index * 30}ms` }"
          ></div>
        </div>
      </div>

      <div class="panel mosaic-panel">
        <div class="panel-title">
          <span>设备状态马赛克</span>
          <span class="endpoint-tag">Socket.IO event: mosaic</span>
        </div>
        <div class="mosaic-grid">
          <div
            v-for="cell in mosaic"
            :key="cell.id"
            class="mosaic-cell"
            :class="`status-${cell.status}`"
            :title="`${cell.name} · ${statusText(cell.status)}`"
            :style="{ animationDelay: `${cell.index * 8}ms` }"
          ></div>
        </div>
        <div class="mosaic-legend">
          <span><i class="legend-dot normal"></i>正常</span>
          <span><i class="legend-dot warning"></i>预警</span>
          <span><i class="legend-dot alarm"></i>告警</span>
          <span><i class="legend-dot offline"></i>离线</span>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-title">
          <span>告警列表</span>
          <span class="endpoint-tag">Socket.IO event: list</span>
        </div>
        <div class="list-table">
          <div class="list-row list-head">
            <span>时间</span>
            <span>设备</span>
            <span>级别</span>
            <span>内容</span>
          </div>
          <div class="list-body">
            <div class="list-row" v-for="row in alarms" :key="row.id">
              <span class="muted-cell">{{ row.time }}</span>
              <span>{{ row.device }}</span>
              <span class="level-tag" :class="`level-${row.level}`">{{ levelText(row.level) }}</span>
              <span class="message-cell">{{ row.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="panel-footer">
      <span>累计消息 <b>{{ messageCount }}</b> 条</span>
      <span>最近推送 {{ lastMessageAt }} · {{ lastMessageType }}</span>
      <span>{{ isMock ? 'MockSocket.IO 通道' : '自动重连已开启' }}</span>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { io } from 'socket.io-client'
import {
  createDashboardSnapshot,
  normalizeDashboard,
  formatTime,
  statusText,
  levelText
} from '../utils/dashboardDemo'

/**
 * WebSocketDashboard 使用说明
 * ============================================================
 * 1. 接入真实后端：
 * <WebSocketDashboard
 *   socket-url="https://example.com"
 *   :auto-reconnect="true"
 * />
 *
 * 2. 后端推送协议（Socket.IO 事件）：
 * 单独推送：
 * socket.emit("stats", { items: [], trend: [] })
 * socket.emit("mosaic", [])
 * socket.emit("list", [])
 *
 * 一次推送完整快照：
 * socket.emit("dashboard", { stats, mosaic, alarms })
 *
 * 3. 注意事项：
 * - 前端只接收推送，不要再像改前组件那样用 setInterval 调三个接口。
 * - Socket.IO 自带心跳和断线重连，业务层不需要再发送 ping。
 * - 认证信息可放在 URL query 或 socketOptions.auth 中，不要硬编码 token。
 * - 组件卸载时必须调用 disconnect，避免连接残留和重复推送。
 * - 为兼容旧协议，组件也监听 message 事件，支持 { type, data } 推送格式。
 */
const props = defineProps({
  socketUrl: {
    type: String,
    default: ''
  },
  socketOptions: {
    type: Object,
    default: () => ({})
  },
  autoReconnect: {
    type: Boolean,
    default: true
  }
})

/**
 * socketUrl 默认空字符串，表示走 MockSocketClient 模拟推送；
 * 传入真实 http(s) 地址后，组件会创建 Socket.IO 连接。
 * autoReconnect 映射为 Socket.IO 的 reconnection 配置。
 */
const stats = ref(createDashboardSnapshot().stats)
const mosaic = ref(createDashboardSnapshot().mosaic)
const alarms = ref(createDashboardSnapshot().alarms)
const messageCount = ref(0)
const lastMessageAt = ref('--')
const lastMessageType = ref('--')
const connectionStatus = ref(props.socketUrl ? '连接中' : '模拟推送')

let socket = null

const isMock = computed(() => !props.socketUrl)
const socketLabel = computed(() => props.socketUrl || 'MockSocket.IO://dashboard')
const connectionState = computed(() => {
  const status = connectionStatus.value
  if (status === '已连接' || status === '模拟推送') return 'connected'
  if (status === '连接中' || status === '重连中') return 'connecting'
  return 'disconnected'
})

class MockSocketClient {
  constructor() {
    this.listeners = new Map()
    this.closed = false
    this.connected = false
    this.pushTimer = null
    this.connectTimer = null

    this.connectTimer = setTimeout(() => this.connect(), 300)
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(handler)
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event, ...args) {
    this.listeners.get(event)?.forEach((handler) => handler(...args))
  }

  connect() {
    if (this.closed || this.connected) return

    this.connected = true
    this.emit('connect')

    this.pushTimer = setInterval(() => {
      if (!this.connected) return
      this.emit('dashboard', createDashboardSnapshot())
    }, 1800)
  }

  disconnect() {
    clearTimeout(this.connectTimer)
    if (!this.connected) return

    this.connected = false
    clearInterval(this.pushTimer)
    this.emit('disconnect', 'mock client close')
  }

  close() {
    if (this.closed) return

    this.closed = true
    clearTimeout(this.connectTimer)
    this.disconnect()
    this.listeners.clear()
  }
}

const applySnapshot = (data) => {
  const normalized = normalizeDashboard(data)
  stats.value = normalized.stats
  mosaic.value = normalized.mosaic
  alarms.value = normalized.alarms
}

const markMessage = (type) => {
  messageCount.value += 1
  lastMessageAt.value = formatTime(new Date())
  lastMessageType.value = type
}

const handleDashboard = (data) => {
  markMessage('dashboard')
  applySnapshot(data)
}

const handleStats = (data) => {
  markMessage('stats')
  if (data?.items) {
    stats.value = data
  }
}

const handleMosaic = (data) => {
  markMessage('mosaic')
  if (Array.isArray(data)) {
    mosaic.value = data
  }
}

const handleList = (data) => {
  markMessage('list')
  if (Array.isArray(data)) {
    alarms.value = data
  }
}

const handleAlarms = (data) => {
  markMessage('alarms')
  if (Array.isArray(data)) {
    alarms.value = data
  }
}

/**
 * Socket.IO 收到事件推送后才刷新页面。
 * 除了独立事件，也兼容旧的 { type, data } message 协议。
 */
const handleMessage = (payload) => {
  if (!payload || typeof payload !== 'object') return

  const type = payload.type || 'message'
  markMessage(type)

  if (type === 'dashboard') {
    applySnapshot(payload.data)
    return
  }

  if (type === 'stats' && payload.data?.items) {
    stats.value = payload.data
  }

  if (type === 'mosaic' && Array.isArray(payload.data)) {
    mosaic.value = payload.data
  }

  if ((type === 'list' || type === 'alarms') && Array.isArray(payload.data)) {
    alarms.value = payload.data
  }
}

const bindDashboardEvents = (client) => {
  client.on('dashboard', handleDashboard)
  client.on('stats', handleStats)
  client.on('mosaic', handleMosaic)
  client.on('list', handleList)
  client.on('alarms', handleAlarms)
  client.on('message', handleMessage)
}

const normalizeSocketUrl = (url) => {
  if (url.startsWith('ws://')) return `http://${url.slice(5)}`
  if (url.startsWith('wss://')) return `https://${url.slice(6)}`
  return url
}

/**
 * Socket.IO 客户端自带心跳与重连，只在这里管理连接生命周期。
 * 不要在 connect 或事件回调里再发起三个 HTTP 接口请求。
 */
const connectSocket = () => {
  connectionStatus.value = '连接中'

  try {
    socket = io(normalizeSocketUrl(props.socketUrl), {
      ...props.socketOptions,
      autoConnect: false,
      reconnection: props.autoReconnect
    })
  } catch {
    connectionStatus.value = '连接失败'
    return
  }

  socket.on('connect', () => {
    connectionStatus.value = '已连接'
  })
  socket.on('connect_error', () => {
    connectionStatus.value = '连接异常'
  })
  socket.on('disconnect', () => {
    connectionStatus.value = '连接断开'
  })
  socket.on('reconnect_attempt', () => {
    connectionStatus.value = '重连中'
  })
  socket.on('reconnect_failed', () => {
    connectionStatus.value = '重连失败'
  })

  bindDashboardEvents(socket)
  socket.connect()
}

const startMock = () => {
  connectionStatus.value = '模拟推送'
  socket = new MockSocketClient()
  socket.on('connect', () => {
    connectionStatus.value = '模拟推送'
  })
  bindDashboardEvents(socket)
}

const deltaClass = (delta) => (delta.startsWith('+') ? 'up' : 'down')

onMounted(() => {
  if (props.socketUrl) {
    connectSocket()
  } else {
    startMock()
  }
})

/**
 * 组件销毁时主动断开 Socket.IO，并清掉所有业务监听器。
 */
onBeforeUnmount(() => {
  socket?.removeAllListeners?.()
  socket?.disconnect?.()
  socket?.close?.()
})
</script>

<style scoped>
.dashboard-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #2c3035;
  border-radius: 8px;
  background: #111315;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.title-block {
  min-width: 240px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #2dd4bf;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

h2 {
  margin: 0;
  color: #f5f7fa;
  font-size: 20px;
  font-weight: 700;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.mode-tag,
.endpoint-tag,
.meta-item,
.socket-label,
.panel-footer span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 5px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.mode-tag {
  padding: 6px 9px;
  color: #101315;
  font-weight: 700;
  background: #2dd4bf;
}

.endpoint-tag {
  padding: 4px 7px;
  color: #aab2bd;
  background: #22262b;
  border: 1px solid #343941;
}

.meta-item {
  padding: 6px 9px;
  color: #d7dce3;
  background: #1b1f24;
  border: 1px solid #2f343b;
}

.socket-label {
  max-width: 280px;
  padding: 6px 9px;
  color: #9aa3ae;
  background: #1b1f24;
  border: 1px solid #2f343b;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #64748b;
}

.status-dot.state-connected {
  background: #2dd4bf;
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.14);
}

.status-dot.state-connecting {
  background: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.14);
}

.status-dot.state-disconnected {
  background: #fb7185;
  box-shadow: 0 0 0 3px rgba(251, 113, 133, 0.14);
}

.dashboard-grid {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(320px, 0.92fr) minmax(420px, 1.08fr);
  grid-template-rows: minmax(220px, 0.9fr) minmax(250px, 1.1fr);
  gap: 12px;
}

.panel {
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid #30343a;
  border-radius: 8px;
  background: #17191d;
  overflow: hidden;
}

.list-panel {
  grid-row: 1 / -1;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #eef2f6;
  font-size: 14px;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  min-width: 0;
  padding: 10px;
  border: 1px solid #2b3036;
  border-radius: 6px;
  background: #20242a;
}

.stat-label {
  display: block;
  margin-bottom: 8px;
  color: #9aa3ae;
  font-size: 12px;
}

.stat-main {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.stat-value {
  font-size: 22px;
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  color: #8b95a1;
  font-size: 11px;
}

.stat-delta {
  display: inline-block;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
}

.stat-delta.up {
  color: #2dd4bf;
}

.stat-delta.down {
  color: #fb7185;
}

.trend-chart {
  min-height: 72px;
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 10px 4px 0;
  border-top: 1px solid #262b31;
}

.trend-bar {
  width: 100%;
  min-height: 5px;
  border-radius: 3px 3px 1px 1px;
  background: linear-gradient(180deg, #22d3ee, #2dd4bf);
  animation: rise 420ms ease-out both;
}

.mosaic-grid {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 4px;
  align-content: stretch;
}

.mosaic-cell {
  min-width: 0;
  border-radius: 3px;
  animation: fadeIn 360ms ease-out both;
}

.status-normal {
  background: #2dd4bf;
  box-shadow: inset 0 0 0 1px rgba(17, 19, 21, 0.42);
}

.status-warning {
  background: #fbbf24;
  box-shadow: inset 0 0 0 1px rgba(17, 19, 21, 0.42);
}

.status-alarm {
  background: #fb7185;
  box-shadow: inset 0 0 0 1px rgba(17, 19, 21, 0.42);
}

.status-offline {
  background: #4b5563;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.mosaic-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #aeb6c0;
  font-size: 12px;
}

.mosaic-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-dot.normal {
  background: #2dd4bf;
}

.legend-dot.warning {
  background: #fbbf24;
}

.legend-dot.alarm {
  background: #fb7185;
}

.legend-dot.offline {
  background: #4b5563;
}

.list-table {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #2b3036;
  border-radius: 6px;
  overflow: hidden;
}

.list-row {
  display: grid;
  grid-template-columns: 76px 86px 64px minmax(150px, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  color: #d7dce3;
  font-size: 12px;
}

.list-head {
  color: #9aa3ae;
  font-weight: 700;
  background: #20242a;
  border-bottom: 1px solid #2b3036;
}

.list-body {
  min-height: 0;
  flex: 1;
  overflow: auto;
}

.list-body .list-row {
  border-bottom: 1px solid #262b31;
}

.list-body .list-row:last-child {
  border-bottom: 0;
}

.muted-cell {
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
}

.level-tag {
  width: fit-content;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.level-critical {
  color: #fecdd3;
  background: rgba(251, 113, 133, 0.18);
  border: 1px solid rgba(251, 113, 133, 0.5);
}

.level-major {
  color: #fde68a;
  background: rgba(251, 191, 36, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.5);
}

.level-warning {
  color: #99f6e4;
  background: rgba(45, 212, 191, 0.14);
  border: 1px solid rgba(45, 212, 191, 0.46);
}

.message-cell {
  min-width: 0;
  overflow: hidden;
  color: #c6ccd4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid #262b31;
  color: #9aa3ae;
}

.panel-footer b {
  color: #2dd4bf;
}

@keyframes rise {
  from {
    height: 8%;
    opacity: 0.45;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0.35;
    transform: scale(0.82);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 900px) {
  .dashboard-panel {
    height: auto;
    min-height: 100%;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    overflow: visible;
  }

  .list-panel {
    grid-row: auto;
    min-height: 360px;
  }

  .mosaic-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}
</style>
