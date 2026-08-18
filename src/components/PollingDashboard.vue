<template>
  <section class="dashboard-panel polling-panel">
    <header class="panel-header">
      <div class="title-block">
        <p class="eyebrow">改前组件</p>
        <h2>定时轮询 Dashboard</h2>
      </div>
      <div class="header-meta">
        <span class="mode-tag polling">HTTP 轮询</span>
        <span class="meta-item">
          <i class="status-dot" :class="{ active: !loading }"></i>
          {{ loading ? '请求中' : '轮询中' }}
        </span>
        <span class="meta-item">{{ intervalMs / 1000 }}s / 次</span>
      </div>
    </header>

    <div class="dashboard-grid">
      <div class="panel stats-panel">
        <div class="panel-title">
          <span>统计总览</span>
          <span class="endpoint-tag">GET /dashboard/stats</span>
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
          <span class="endpoint-tag">GET /dashboard/mosaic</span>
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
          <span class="endpoint-tag">GET /dashboard/alarm-list</span>
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
      <span>累计请求 <b>{{ requestCount }}</b> 次</span>
      <span>最近刷新 {{ lastRefresh }}</span>
      <span>三个接口每 {{ intervalMs / 1000 }}s 并行请求一次</span>
    </footer>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  createStats,
  createMosaic,
  createAlarmList,
  formatTime,
  statusText,
  levelText
} from '../utils/dashboardDemo'

/**
 * 改前逻辑：定时器每 3s 同时请求 3 个接口。
 * 联调时把下面 3 个 mock 函数替换成 request.get 即可。
 */
const intervalMs = 3000
const requestCount = ref(0)
const loading = ref(false)
const lastRefresh = ref('--')
const stats = ref(createStats())
const mosaic = ref(createMosaic())
const alarms = ref(createAlarmList())

let timer = null

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchStatsApi = async () => {
  // return request.get('/dashboard/stats')
  await wait(120 + Math.round(Math.random() * 120))
  return createStats()
}

const fetchMosaicApi = async () => {
  // return request.get('/dashboard/mosaic')
  await wait(120 + Math.round(Math.random() * 120))
  return createMosaic()
}

const fetchAlarmListApi = async () => {
  // return request.get('/dashboard/alarm-list')
  await wait(120 + Math.round(Math.random() * 120))
  return createAlarmList()
}

const refreshAll = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const [nextStats, nextMosaic, nextAlarms] = await Promise.all([
      fetchStatsApi(),
      fetchMosaicApi(),
      fetchAlarmListApi()
    ])

    stats.value = nextStats
    mosaic.value = nextMosaic
    alarms.value = nextAlarms
    requestCount.value += 3
    lastRefresh.value = formatTime(new Date())
  } finally {
    loading.value = false
  }
}

const deltaClass = (delta) => (delta.startsWith('+') ? 'up' : 'down')

onMounted(() => {
  refreshAll()
  timer = setInterval(refreshAll, intervalMs)
})

onBeforeUnmount(() => {
  clearInterval(timer)
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
  min-width: 220px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #fbbf24;
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
}

.mode-tag,
.endpoint-tag,
.meta-item,
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
  color: #111315;
  font-weight: 700;
  background: #fbbf24;
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

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #64748b;
}

.status-dot.active {
  background: #2dd4bf;
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.14);
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
  color: #fbbf24;
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
