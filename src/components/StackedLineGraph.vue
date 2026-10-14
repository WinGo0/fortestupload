<template>
  <div class="stacked-line-graph">
    <div v-if="$slots.header" class="chart-header">
      <slot name="header" />
    </div>
    <div ref="chartRef" class="chart-canvas"></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { isNil } from 'lodash'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  legendSelected: {
    type: Boolean,
    default: false
  },
  referenceParamCode: {
    type: String,
    default: ''
  },
  selectedParamCodes: {
    type: Array,
    default: undefined
  }
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

const yAxisSpace = 44
const colorList = ['#5b8ff9', '#5ad8a6', '#f6bd16', '#e8684a', '#6dc8ec', '#9270ca']
const upperColor = '#ff4d4f'
const lowerColor = '#faad14'

const getSeriesColor = (_, index) => colorList[index % colorList.length]
const isUpperLine = (paramCode) => String(paramCode ?? '').includes('UpperLine')
const isLowerLine = (paramCode) => String(paramCode ?? '').includes('LowerLine')
const formatYAxis = (unit) => (unit ? `(${unit})` : '')
const formatTimeLabel = (value) => dayjs(value).format('HH:mm:ss')

const getTimeValue = (value) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? value : parsed
}

const getDataList = (item) => {
  if (Array.isArray(item?.dataList)) return item.dataList

  if (Array.isArray(item?.valueList)) {
    return item.valueList.map((value, index) => ({
      timeStr: item.dateList?.[index],
      value
    }))
  }

  return []
}

const seriesData = computed(() => {
  const source = Array.isArray(props.data) ? props.data : []
  if (!Array.isArray(props.selectedParamCodes) || props.selectedParamCodes.length === 0) {
    return source
  }

  const selectedCodes = new Set(props.selectedParamCodes.map((item) => String(item)))
  return source.filter((item) => selectedCodes.has(String(item.paramCode)))
})

const rawUnitList = computed(() => {
  const units = Array.from(new Set(seriesData.value.map((item) => item.paramUnit)))
  return units.length ? units : []
})

const referenceItem = computed(() =>
  seriesData.value.find((item) => String(item.paramCode) === String(props.referenceParamCode))
)

const hasMainAxis = computed(() =>
  Boolean(String(props.referenceParamCode ?? '').trim() && referenceItem.value)
)

const mainUnit = computed(
  () => referenceItem.value?.paramUnit ?? rawUnitList.value?.[0] ?? undefined
)

const unitList = computed(() => {
  if (!hasMainAxis.value) return rawUnitList.value

  return [
    mainUnit.value,
    ...rawUnitList.value.filter((unit) => unit !== mainUnit.value)
  ]
})

const unitAxisIndexMap = computed(
  () => new Map(unitList.value.map((unit, index) => [unit, index]))
)

const buildMarkLine = (item) => {
  if (
    seriesData.value.length !== 1 ||
    isNil(item.lowerLimit) ||
    isNil(item.upperLimit)
  ) {
    return { symbol: 'none', data: [] }
  }

  return {
    symbol: 'none',
    label: {
      show: true,
      position: 'insideEndTop',
      color: 'inherit',
      fontSize: 14,
      formatter: (params) =>
        `${params.value}${item.paramUnit ? ` / ${item.paramUnit}` : ''}`
    },
    data: [
      {
        name: '上警戒线',
        yAxis: item.upperLimit,
        lineStyle: {
          color: upperColor
        }
      },
      {
        name: '下警戒线',
        yAxis: item.lowerLimit,
        lineStyle: {
          color: lowerColor
        }
      }
    ]
  }
}

const buildItemStyle = (item) => {
  if (isUpperLine(item.paramCode)) {
    return { color: upperColor }
  }

  if (isLowerLine(item.paramCode)) {
    return { color: lowerColor }
  }

  if (
    seriesData.value.length === 1 &&
    !isNil(item.lowerLimit) &&
    !isNil(item.upperLimit)
  ) {
    return {
      color: (params) => {
        const value = params.value?.[1]
        return value > item.upperLimit
          ? upperColor
          : value < item.lowerLimit
            ? lowerColor
            : getSeriesColor(item, 0)
      }
    }
  }

  return undefined
}

const seriesConfigs = computed(() =>
  seriesData.value.map((item, index) => ({
    name: item.paramName || item.name || item.paramCode || `系列${index + 1}`,
    type: 'line',
    yAxisIndex: unitAxisIndexMap.value.get(item.paramUnit) ?? 0,
    data: getDataList(item)
      .slice()
      .sort((a, b) => getTimeValue(a.timeStr) - getTimeValue(b.timeStr))
      .map((itemPoint) => [getTimeValue(itemPoint.timeStr), itemPoint.value]),
    symbol: 'none',
    markLine: buildMarkLine(item),
    lineStyle: {
      type: isUpperLine(item.paramCode) || isLowerLine(item.paramCode)
        ? 'dashed'
        : 'solid'
    },
    itemStyle: buildItemStyle(item)
  }))
)

const buildOption = () => ({
  color: colorList,
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    show: seriesConfigs.value.length > 1,
    selectedMode: props.legendSelected,
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
    boundaryGap: false,
    axisLabel: {
      formatter: (params) => formatTimeLabel(params.value)
    },
    axisPointer: {
      label: {
        formatter: (params) => formatTimeLabel(params.value)
      }
    }
  },
  yAxis: unitList.value.map((unit, index) => ({
    type: 'value',
    name: formatYAxis(unit),
    position: hasMainAxis.value && index === 0 ? 'right' : 'left',
    offset: hasMainAxis.value
      ? index <= 1
        ? 0
        : (index - 1) * yAxisSpace
      : index * yAxisSpace,
    alignTicks: true,
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      rotate: 0,
      margin: 10,
      showMinLabel: true,
      showMaxLabel: true,
      formatter: (value) => Number(Number(value).toFixed(2))
    },
    nameTextStyle: {
      align: hasMainAxis.value && index === 0 ? 'left' : 'right',
      padding:
        hasMainAxis.value && index === 0 ? [0, 0, 0, 8] : [0, 8, 0, 0]
    }
  })),
  dataZoom: [
    {
      type: 'slider',
      height: 25,
      bottom: 30
    },
    {
      type: 'inside'
    }
  ],
  series: seriesConfigs.value
})

const renderChart = () => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption(buildOption(), true)
}

onMounted(() => {
  renderChart()
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartRef.value)
})

watch(
  () => [
    props.data,
    props.referenceParamCode,
    props.selectedParamCodes,
    props.legendSelected
  ],
  renderChart,
  { deep: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.stacked-line-graph {
  width: 100%;
}

.chart-header {
  margin-bottom: 8px;
}

.chart-canvas {
  width: 100%;
  height: 450px;
  min-height: 320px;
}
</style>
