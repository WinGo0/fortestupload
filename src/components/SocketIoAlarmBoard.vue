<template>
  <div class="alarm-board" :class="{ connected: connected }">
    <div class="alarm-header">
      <h1>实时报警看板</h1>

      <svg
        class="heart-icon heart-full"
        viewBox="0 0 24 24"
        aria-label="连接正常"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="#d93025"
        />
      </svg>

      <svg
        class="heart-icon heart-broken"
        viewBox="0 0 24 24"
        aria-label="连接断开"
      >
        <title>连接断开</title>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="#9ca3af"
        />
        <polyline
          points="12,3.4 10.7,5.6 13.1,7.4 11,9.6 12.9,11.6 10.9,13.8 12.8,15.8 11.1,17.8 12.7,19.8 12,20.9"
          fill="none"
          stroke="#fff"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <span class="conn-text">{{ connected ? '已连接' : '未连接' }}</span>
      <button class="btn" :disabled="!connected" @click="refreshAlarmData">
        手动刷新
      </button>
      <button class="btn btn-secondary" @click="toggleDisconnect">
        模拟断开
      </button>
      <span class="status-msg">{{ statusMsg }}</span>
      <span class="last-update">{{ lastUpdate }}</span>
    </div>

    <div ref="tableWrapRef" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>报警标题</th>
            <th>级别</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in records" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.title }}</td>
            <td>
              <span class="badge" :class="`level-${item.level}`">
                {{ levelText(item.level) }}
              </span>
            </td>
            <td>
              <span class="badge" :class="`status-${item.status}`">
                {{ statusText(item.status) }}
              </span>
            </td>
            <td>{{ item.createTime }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="5" class="empty">暂无报警记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { io } from 'socket.io-client'

const LEVEL_TEXT = { 1: '紧急', 2: '重要', 3: '一般' }
const STATUS_TEXT = { 1: '未确认', 2: '处理中', 3: '已确认', 4: '已消报' }

const connected = ref(false)
const statusMsg = ref('')
const lastUpdate = ref('')
const records = ref([])
const tableWrapRef = ref(null)
const manualDisconnect = ref(false)

let socket

function levelText(level) {
  return LEVEL_TEXT[level] || level
}

function statusText(status) {
  return STATUS_TEXT[status] || status
}

function setConnected(value) {
  connected.value = value

  if (value) {
    statusMsg.value = ''
  }
}

function renderAlarmData(payload) {
  const prevTop = tableWrapRef.value?.scrollTop || 0
  const json = typeof payload === 'string' ? JSON.parse(payload) : payload

  records.value = (json && json.data) || []

  nextTick(() => {
    requestAnimationFrame(() => {
      if (tableWrapRef.value) {
        tableWrapRef.value.scrollTop = prevTop
      }
    })
  })

  lastUpdate.value = `更新于 ${new Date().toLocaleTimeString()}`
}

async function refreshAlarmData() {
  try {
    const response = await fetch('/api/alarm/mock/refresh')
    const result = await response.json()
    statusMsg.value = result.message || '已刷新'
  } catch (error) {
    statusMsg.value = `刷新失败: ${error.message}`
  }
}

function toggleDisconnect() {
  if (!socket) return

  if (socket.connected) {
    manualDisconnect.value = true
    socket.disconnect()
    statusMsg.value = '已手动断开（模拟异常），心形应裂开'
  } else {
    manualDisconnect.value = false
    socket.connect()
    statusMsg.value = '正在重新连接...'
  }
}

onMounted(() => {
  socket = io('ws://localhost:9092', {
    transports: ['websocket'],
    query: {
      token: 'demo-token',
      userId: 'zhangsan',
      powerId: 'plant-01',
      unitId: 'unit-01',
    },
  })

  socket.on('connect', () => {
    manualDisconnect.value = false
    setConnected(true)
    statusMsg.value = `连接成功，sessionId=${socket.id}`
  })

  socket.on('disconnect', () => {
    setConnected(false)
    statusMsg.value = manualDisconnect.value
      ? '已手动断开'
      : '连接已断开，自动重连中...'
  })

  socket.on('connect_error', (error) => {
    setConnected(false)
    statusMsg.value = `连接失败: ${error.message}`
  })

  socket.on('alarm:board:update', renderAlarmData)
})

onBeforeUnmount(() => {
  if (socket) {
    socket.off('alarm:board:update', renderAlarmData)
    socket.disconnect()
  }
})
</script>

<style scoped>
.alarm-board {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
  color: #333;
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
}

.alarm-header {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 14px 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.alarm-header h1 {
  margin: 0;
  font-size: 20px;
}

.heart-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.heart-full {
  display: none;
}

.heart-broken {
  display: block;
}

.alarm-board.connected .heart-full {
  display: block;
  animation: heartbeat 1.2s ease-in-out infinite;
}

.alarm-board.connected .heart-broken {
  display: none;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.18);
  }

  40% {
    transform: scale(1);
  }

  60% {
    transform: scale(1.12);
  }
}

.conn-text {
  font-size: 14px;
  color: #666;
}

.status-msg {
  font-size: 13px;
  color: #1a73e8;
}

.last-update {
  margin-left: auto;
  font-size: 13px;
  color: #999;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  background: #1a73e8;
  color: #fff;
}

.btn:hover {
  opacity: 0.85;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
}

.table-wrap {
  margin: 16px 24px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
}

tbody td {
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid #f0f1f3;
}

tbody tr:hover {
  background: #f8faff;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: #fff;
}

.level-1,
.status-1 {
  background: #d93025;
}

.level-2 {
  background: #f29900;
}

.level-3 {
  background: #f2c94c;
  color: #5f4200;
}

.status-2 {
  background: #1a73e8;
}

.status-3 {
  background: #34a853;
}

.empty {
  padding: 32px 0;
  text-align: center;
  color: #999;
}

@media (max-width: 640px) {
  .table-wrap {
    margin: 8px;
  }

  .alarm-header {
    padding: 10px 12px;
  }
}
</style>
