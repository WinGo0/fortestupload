<template>
  <div class="search-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>🔍 接口层自动防抖演示（去重模式）</span>
          <el-tag type="info">底层: Axios AbortController</el-tag>
        </div>
      </template>

      <div class="test-area">
        <p class="tips">
          <b>测试方法：</b> 打开浏览器 <b>Network (网络)</b> 面板，然后在 300ms 内疯狂连续点击下方按钮。
          <br/>
          你会发现旧的请求状态会瞬间变为 <span class="cancel-text">canceled</span>，只有最后一次能成功发出去。
        </p>

        <div class="search-form">
          <el-input 
            v-model="keyword" 
            placeholder="搜索关键词..." 
            class="input-with-select"
            clearable
          >
            <template #prepend>ID:</template>
          </el-input>

          <el-button type="primary" @click="handleSimpleSearch">
            普通搜索 (狂点我)
          </el-button>

          <el-button type="success" @click="handleLoadingSearch">
            搜索 (带全屏Loading)
          </el-button>
        </div>

        <el-divider content-position="left">请求日志</el-divider>
        
        <div class="log-panel">
          <ul v-if="logs.length">
            <li v-for="(log, index) in logs" :key="index" :class="log.type">
              [{{ log.time }}] {{ log.msg }}
            </li>
          </ul>
          <el-empty v-else description="暂无日志" :image-size="60" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../utils/request'

const keyword = ref('Vue3-Pinia')
const logs = ref([])

const addLog = (msg, type = 'info') => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    msg,
    type
  })
}

/**
 * 演示 1：普通搜索
 * 没有任何 UI 防抖代码，全靠 request.js 底层拦截
 */
const handleSimpleSearch = async () => {
  addLog(`发起搜索: ${keyword.value}...`, 'pending')
  try {
    // 模拟一个较慢的接口请求
    const data = await request.get('https://httpbin.org/delay/1', {
      _t: Date.now() // 加个时间戳确保 URL 不同，能触发 Network 记录
    })
    addLog('✅ 搜索结果已返回', 'success')
  } catch (err) {
    // 注意：被取消的请求在 request.js 中返回了永远 pending 的 Promise，
    // 所以这里几乎不会进 catch，除非是真实的 500/404 错误。
    addLog(`❌ 请求异常: ${err.message}`, 'error')
  }
}

/**
 * 演示 2：带全屏 Loading 的搜索
 * 演示 request 配置项的灵活性
 */
const handleLoadingSearch = async () => {
  addLog('发起带 Loading 的搜索...', 'pending')
  await request.get('https://httpbin.org/delay/1', {
    showLoading: true // 只有一行配置，就实现了全屏加载
  })
  addLog('✅ Loading 结束', 'success')
}
</script>

<style scoped>
.search-container {
  margin-top: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.tips {
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
  padding: 10px 15px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}
.cancel-text {
  color: #f56c6c;
  font-weight: bold;
}
.search-form {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}
.input-with-select {
  width: 300px;
}
.log-panel {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}
.log-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.log-panel li {
  margin-bottom: 5px;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}
.pending { color: #409eff; }
.success { color: #67c23a; }
.error { color: #f56c6c; }
</style>
