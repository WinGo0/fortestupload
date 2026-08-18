<template>
  <div>
    <div style="margin-bottom: 8px; font-size: 13px; color: #666">
      当前可视范围：{{ rangeText }}
    </div>
    <div ref="chartRef" style="width: 100%; height: 450px"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
const rangeText = ref('')
let chart = null

// 模拟数据
const lineData = []
const base = new Date('2026-07-30 09:39:33').getTime()
for (let i = 0; i <= 500; i++) {
  lineData.push([base + i * 1000, +(32 + Math.random() * 0.2).toFixed(2)])
}

// ========== 防抖：拖动过程中事件会疯狂触发，停手后再处理 ==========
let timer = null
const onDataZoom = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const dz = chart.getOption().dataZoom[0]
    const startTime = new Date(dz.startValue)
    const endTime = new Date(dz.endValue)

    rangeText.value = `${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}`

    // ★ 实际项目里在这里做你的业务，比如：
    // 1. 窗口缩得很小时，请求后端更高精度的数据
    //    fetchDetailData(dz.startValue, dz.endValue)
    // 2. 只渲染可视范围内的事件 markArea，避免几百个色块卡死
    //    updateMarkArea(dz.startValue, dz.endValue)
    console.log('用户停手了，当前范围：', dz.startValue, dz.endValue)
  }, 300)
}

onMounted(() => {
  chart = echarts.init(chartRef.value)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 40, top: 30, bottom: 80 },
    xAxis: { type: 'time' },
    yAxis: { type: 'value', min: 29, max: 33 },
    dataZoom: [
      { type: 'slider', height: 25, bottom: 30 },  // 你截图里那个滑块
      { type: 'inside' }                            // 鼠标滚轮/拖拽缩放
    ],
    series: [{
      name: '参数值',
      type: 'line',
      data: lineData,
      symbol: 'none'
    }]
  })

  // ★ 监听 dataZoom 变化事件
  chart.on('datazoom', onDataZoom)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  chart?.dispose()
})
</script>