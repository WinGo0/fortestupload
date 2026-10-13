<template>
  <main class="page">
    <section class="panel">
      <header class="header">
        <div>
          <p class="eyebrow">COUNTDOWN</p>
          <h1>倒计时</h1>
        </div>
        <el-button @click="router.push('/settings')">设置</el-button>
      </header>

      <div class="digits">
        <div class="cell"><b>{{ pad(store.hours) }}</b><span>时</span></div>
        <div class="cell"><b>{{ pad(store.minutes) }}</b><span>分</span></div>
        <div class="cell"><b>{{ pad(store.seconds) }}</b><span>秒</span></div>
      </div>

      <p class="status">{{ statusText }}</p>

      <el-button type="primary" size="large" class="start-button" @click="store.startCountdown">
        开始倒计时
      </el-button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAudiosStore } from './audios'

const router = useRouter()
const store = useAudiosStore()

const statusText = computed(() => {
  if (store.status === 'running') return '倒计时进行中'
  if (store.status === 'ended') return '倒计时已结束'
  return '等待开始'
})

const pad = (value: number) => String(value).padStart(2, '0')
</script>

<style scoped>
.page {
  box-sizing: border-box;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f0f2f5;
}

.panel {
  box-sizing: border-box;
  width: min(560px, 100%);
  padding: 28px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #2563eb;
}

.header h1 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.digits {
  display: flex;
  gap: 8px;
}

.cell {
  flex: 1;
  min-width: 0;
  padding: 14px 4px;
  text-align: center;
  background: #1f2937;
  border-radius: 6px;
}

.cell b {
  display: block;
  font-size: 30px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: #fff;
}

.cell span {
  font-size: 12px;
  color: #94a3b8;
}

.status {
  margin: 16px 0 0;
  color: #64748b;
}

.start-button {
  width: 100%;
  margin-top: 20px;
}

@media (max-width: 560px) {
  .page {
    padding: 16px;
  }

  .panel {
    padding: 20px;
  }

  .cell b {
    font-size: 24px;
  }
}
</style>
