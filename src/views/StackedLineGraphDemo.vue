<template>
  <div class="stacked-line-demo">
    <StackedLineGraph
      :data="chartData"
      :legend-selected="false"
      :reference-param-code="referenceParamCode"
      :selected-param-codes="selectedParamCodes"
    >
      <template #header>
        <div class="chart-title">变工况趋势</div>
      </template>
    </StackedLineGraph>
  </div>
</template>

<script setup>
import StackedLineGraph from '../components/StackedLineGraph.vue'

const baseTime = new Date('2026-10-13 20:00:00').getTime()
const referenceParamCode = 'main-pressure'

const createDataList = (getValue, count = 300) =>
  Array.from({ length: count }, (_, index) => ({
    timeStr: baseTime + index * 1000,
    value: getValue(index)
  }))

const chartData = [
  {
    paramCode: referenceParamCode,
    paramName: '主蒸汽压力',
    paramUnit: 'MPa',
    dataList: createDataList((index) =>
      Number((12 + Math.sin(index / 22) * 1.8).toFixed(3))
    )
  },
  {
    paramCode: 'main-temperature',
    paramName: '主蒸汽温度',
    paramUnit: '℃',
    dataList: createDataList((index) =>
      Number((536 + Math.sin(index / 28) * 12).toFixed(2))
    )
  },
  {
    paramCode: 'secondary-pressure',
    paramName: '再热蒸汽压力',
    paramUnit: 'MPa',
    dataList: createDataList((index) =>
      Number((3.2 + Math.cos(index / 25) * 0.6).toFixed(3))
    )
  }
]

const selectedParamCodes = chartData.map((item) => item.paramCode)
</script>

<style scoped>
.stacked-line-demo {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}

.chart-title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}
</style>
