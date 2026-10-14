<template>
  <div class="line-chart">
    <div v-if="showRangeText" class="range-text">
      当前可视范围：{{ rangeText }}
    </div>
    <div ref="chartRef" class="chart-canvas"></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  seriesData: {
    type: Array,
    default: undefined
  },
  referenceParamCode: {
    type: String,
    default: ''
  },
  mainAxisMin: {
    default: null
  },
  mainAxisMax: {
    default: null
  },
  showRangeText: {
    type: Boolean,
    default: true
  }
})

const chartRef = ref(null)
const rangeText = ref('')
let chart = null
let timer = null
let resizeObserver = null

const yAxisSpace = 44
const fallbackBaseTime = new Date('2026-07-30 09:39:33').getTime()
const fallbackSeries = {
  paramCode: 'demo-temperature',
  paramName: '参数值',
  paramUnit: '℃',
  dataList: Array.from({ length: 501 }, (_, index) => ({
    timeStr: fallbackBaseTime + index * 1000,
    value: Number((32 + Math.random() * 0.2).toFixed(2))
  }))
}

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const getTimeValue = (value) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? value : parsed
}

const normalizePoint = (point) => {
  if (Array.isArray(point)) {
    if (point.length > 1) {
      return [getTimeValue(point[0]), toFiniteNumber(point[1])]
    }
    return [null, toFiniteNumber(point[0])]
  }

  if (point && typeof point === 'object') {
    const time = point.timeStr ?? point.date ?? point.time ?? point.timestamp
    const value = point.value ?? point.val
    return [getTimeValue(time), toFiniteNumber(value)]
  }

  return [null, toFiniteNumber(point)]
}

const normalizeSeries = (series = {}) => {
  const sourceList = Array.isArray(series.dataList)
    ? series.dataList
    : Array.isArray(series.valueList)
      ? series.valueList.map((value, index) => ({
          timeStr: series.dateList?.[index] ?? fallbackBaseTime + index * 1000,
          value
        }))
      : []

  return {
    ...series,
    dataList: sourceList.map(normalizePoint)
  }
}

const usingFallbackData = computed(() => {
  const hasSeriesData = Array.isArray(props.seriesData) && props.seriesData.length > 0
  const hasDataSeries = Array.isArray(props.data?.seriesData) && props.data.seriesData.length > 0
  const hasLegacyData = Array.isArray(props.data?.valueList) && props.data.valueList.length > 0
  return !hasSeriesData && !hasDataSeries && !hasLegacyData
})

const seriesList = computed(() => {
  if (Array.isArray(props.seriesData) && props.seriesData.length > 0) {
    return props.seriesData.map(normalizeSeries)
  }

  if (Array.isArray(props.data?.seriesData) && props.data.seriesData.length > 0) {
    return props.data.seriesData.map(normalizeSeries)
  }

  if (Array.isArray(props.data?.valueList) && props.data.valueList.length > 0) {
    return [
      normalizeSeries({
        paramCode: props.data.paramCode,
        paramName: props.data.paramName || props.data.paramCode || '参数值',
        paramUnit: props.data.paramUnit || props.data.unit || '',
        dateList: props.data.dateList,
        valueList: props.data.valueList
      })
    ]
  }

  return [normalizeSeries(fallbackSeries)]
})

const referenceParamCode = computed(() => String(props.referenceParamCode ?? '').trim())
const referenceSeries = computed(() => {
  if (!referenceParamCode.value) return null
  return (
    seriesList.value.find(
      (series) => String(series.paramCode ?? '') === referenceParamCode.value
    ) ?? null
  )
})
const hasMainAxis = computed(() => Boolean(referenceSeries.value))
const mainAxisMin = computed(() => toFiniteNumber(props.mainAxisMin))
const mainAxisMax = computed(() => toFiniteNumber(props.mainAxisMax))
const hasValidMainRange = computed(
  () =>
    hasMainAxis.value &&
    mainAxisMin.value !== null &&
    mainAxisMax.value !== null &&
    mainAxisMin.value <= mainAxisMax.value
)

const mainSeriesIndex = computed(() => {
  if (!referenceSeries.value) return -1
  return seriesList.value.indexOf(referenceSeries.value)
})

const unitList = computed(() => {
  const units = []
  const mainSeries = seriesList.value[mainSeriesIndex.value] ?? seriesList.value[0]
  const mainUnit = mainSeries?.paramUnit ?? ''

  if (hasMainAxis.value && mainUnit !== null && mainUnit !== undefined) {
    units.push(mainUnit)
  }

  seriesList.value.forEach((series) => {
    const unit = series.paramUnit ?? ''
    if (!units.includes(unit)) units.push(unit)
  })

  return units
})

const unitAxisIndexMap = computed(() => {
  const map = new Map()
  unitList.value.forEach((unit, index) => map.set(unit, index))
  return map
})

const seriesConfigs = computed(() =>
  seriesList.value.map((series, index) => {
    const unit = series.paramUnit ?? ''
    const yAxisIndex = unitAxisIndexMap.value.get(unit) ?? 0

    return {
      name: series.paramName || series.name || `系列${index + 1}`,
      type: 'line',
      yAxisIndex,
      data: series.dataList,
      symbol: 'none',
      // Keep the original points. ECharts clips the line exactly at the
      // main-axis min/max boundary when these two options are combined.
      clip: true,
      connectNulls: false
    }
  })
)

const formatYAxis = (unit) => (unit ? `(${unit})` : '')

const formatYAxisLabel = (value) => {
  const number = toFiniteNumber(value)
  return number === null ? '' : Number(number.toFixed(2))
}

const buildOption = () => {
  const yAxis = unitList.value.map((unit, index) => {
    const isMain = hasMainAxis.value && index === 0
    const axis = {
      type: 'value',
      name: formatYAxis(unit),
      position: isMain ? 'right' : 'left',
      offset: hasMainAxis.value
        ? index <= 1
          ? 0
          : (index - 1) * yAxisSpace
        : index * yAxisSpace,
      alignTicks: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        rotate: 0,
        margin: 10,
        showMinLabel: true,
        showMaxLabel: true,
        formatter: formatYAxisLabel
      },
      nameTextStyle: {
        align: isMain ? 'left' : 'right',
        padding: isMain ? [0, 0, 0, 8] : [0, 8, 0, 0]
      }
    }

    if (hasValidMainRange.value && isMain) {
      axis.min = mainAxisMin.value
      axis.max = mainAxisMax.value
    } else if (usingFallbackData.value && index === 0) {
      axis.min = 29
      axis.max = 33
    }

    return axis
  })

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      show: seriesConfigs.value.length > 1,
      top: 0
    },
    grid: {
      left: 60,
      right: hasMainAxis.value ? 70 : 40,
      top: seriesConfigs.value.length > 1 ? 42 : 30,
      bottom: 80
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis,
    dataZoom: [
      { type: 'slider', height: 25, bottom: 30 },
      { type: 'inside' }
    ],
    series: seriesConfigs.value
  }
}

const renderChart = () => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption(buildOption(), true)
}

const onDataZoom = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const dataZoom = chart?.getOption()?.dataZoom?.[0]
    if (!dataZoom) return

    const startTime = new Date(dataZoom.startValue)
    const endTime = new Date(dataZoom.endValue)
    rangeText.value = `${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}`
  }, 300)
}

onMounted(() => {
  renderChart()
  chart.on('datazoom', onDataZoom)
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartRef.value)
})

watch(
  () => [props.data, props.seriesData, props.referenceParamCode, props.mainAxisMin, props.mainAxisMax],
  renderChart,
  { deep: true }
)

onBeforeUnmount(() => {
  clearTimeout(timer)
  resizeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.line-chart {
  width: 100%;
}

.range-text {
  margin-bottom: 8px;
  color: #666;
  font-size: 13px;
}

.chart-canvas {
  width: 100%;
  height: 450px;
  min-height: 320px;
}
</style>
