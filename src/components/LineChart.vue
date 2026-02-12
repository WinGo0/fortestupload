<template>
  <div ref="chartDom" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import * as echarts from "echarts";
import dayjs from "dayjs";
import { isNil } from "lodash";

// Inline implementation of calcYAxisOptions (replaces missing @/utils import)
const calcYAxisOptions = (dataList, paddingFactor = 3) => {
  if (!dataList || dataList.length === 0) {
    return { min: 0, max: 100, interval: 20, precision: 0 };
  }
  
  // Filter valid numbers
  const validData = dataList
    .filter(v => !isNil(v) && v !== "" && !isNaN(Number(v)))
    .map(Number);
    
  if (validData.length === 0) {
    return { min: 0, max: 100, interval: 20, precision: 0 };
  }

  let min = Math.min(...validData);
  let max = Math.max(...validData);

  // Handle flat line (min == max)
  if (min === max) {
    if (max === 0) {
      max = 1;
      min = 0;
    } else {
      max = max * 1.1;
      min = min * 0.9;
    }
  } else {
    // Add dynamic padding
    const range = max - min;
    const padding = range * 0.1; // 10% padding
    max += padding;
    min -= padding;
  }
  
  // Calculate precision based on data (simplified)
  // If data has decimals, use 2, else 0? 
  // The screenshot logic uses 'decimalPlaces' and 'precision' 
  // We'll default to 2 for safety as seen in typical sensor data
  const precision = 2;
  
  // Calculate a nice interval
  const count = 5; // Target 5 ticks
  const rawInterval = (max - min) / count;
  const interval = Number(rawInterval.toFixed(precision));

  return {
    min: Number(min.toFixed(precision)),
    max: Number(max.toFixed(precision)),
    interval: interval === 0 ? 1 : interval,
    precision: precision,
    decimalPlaces: precision
  };
};

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  alarmRule: {
    type: Number,
    default: 1 // 1 普通阈值 上下限是常量 2 对比阈值 上下限是曲线
  },
  thresholdList: {
    type: Array,
    default: () => [] // 对比阈值 必传
  }
});

const chartDom = ref(null);
const myEcharts = ref(null);

const useResize = (chart) => {
  const handleResize = () => {
    // console.log("handleResize");
    if (chart.value) {
      chart.value.resize();
    }
  };
  onMounted(() => {
    window.addEventListener("resize", handleResize);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
  });
};

useResize(myEcharts);

const updateChart = () => {
  if (!myEcharts.value) return;
  const { data } = props;
  if (!data) return;

  let yAxisOption = {};
  const isLimitNotNull = !isNil(data?.paramUpperLimit) && !isNil(data?.paramLowerLimit);
  
  // Construct dataList for scaling calculation
  const dataList = isLimitNotNull
    ? [...(data?.valueList || []), data?.paramUpperLimit, data?.paramLowerLimit]
    : [...(data?.valueList || [])];

  let upperList = [];
  let lowerList = [];

  // 1. Calculate yAxisOption based on alarmRule
  // logic from Image 1 & 2
  
  /* // 上下限是阈值 (Curve thresholds) */
  if (props.alarmRule === 2) {
    const thresholdValues = props.thresholdList
      ?.map((it) => it.dataList.map((ele) => ele.value))
      .flat() || [];
      
    yAxisOption = calcYAxisOptions([...(data?.valueList || []), ...thresholdValues], 3);
    
    upperList = props.thresholdList?.find((it) => it.paramCode && it.paramCode.includes("UpperLine"))?.dataList || [];
    lowerList = props.thresholdList?.find((it) => it.paramCode && it.paramCode.includes("LowerLine"))?.dataList || [];
    // console.log("upperList lowerList", upperList, lowerList);
  } 
  /* // 上下限是常量 (Constant thresholds) */
  else if (
    props.alarmRule === 1 &&
    data?.valueList?.length === 1 &&
    !data?.valueList?.[0]
  ) {
    // Special case for single point empty data?
    yAxisOption = {
      min: 0,
      max: 0,
      interval: 0,
       decimalPlaces: 0,
       precision: 0
    };
  } else {
     // Normal constant threshold case
    yAxisOption = calcYAxisOptions(dataList, 3);
  }

  // 2. Formatters
  const tooltipFormatter = (params) => {
    if (!params || !params.length) return "";
    const p0 = params[0];
    return `
      ${p0.name}
      <br /> <div style="display: flex;justify-content: space-between;align-items: center;">${p0.marker || ""} ${p0.value}</div>
      <div style="margin-top: 5px;">${data?.paramCode || ""}</div>
      <div style="margin-top: 5px;">${data?.paramName || ""}</div>
    `;
  };

  const axisLabelFormatter = (val) => {
    if (!val) return "";
    // Image 2: dayjs(val).format...
    return dayjs(val).format("YYYY-MM-DD HH:mm:ss").split(" ").join("\n");
  };

  // 3. Series Data Preparation
  let seriesData = [];
  if (props.alarmRule === 2) {
    seriesData = data?.dateList?.map((ele, index) => {
      return [new Date(ele), data?.valueList[index]]; // [Date, Value]
    });
  } else {
    seriesData = data?.valueList; // Just values? 
    // Wait, if axis is category, just values is fine if xAxis.data matches.
    // If props.alarmRule != 2, xAxis type is 'category', data is data.dateList.
  }

  // 4. MarkLine for Constant Thresholds (alarmRule == 1)
  // The screenshot logic handles 'alarmRule == 2' via extra series.
  // For 'alarmRule == 1', typically markLine is used.
  // Although not explicitly fully shown in Image 4 for the constant case, 
  // it is standard practice and required for function parity.
  const markLineData = [];
  if (props.alarmRule === 1) {
     if (!isNil(data?.paramUpperLimit)) {
         markLineData.push({ 
             yAxis: Number(data.paramUpperLimit), 
             name: '上警戒线',
             lineStyle: { color: '#fd0202', type: 'dashed' }
         });
     }
     if (!isNil(data?.paramLowerLimit)) {
         markLineData.push({ 
             yAxis: Number(data.paramLowerLimit), 
             name: '下警戒线',
             lineStyle: { color: '#fd0202', type: 'dashed' }
         });
     }
  }

  const option = {
    legend: {
      data:
        isLimitNotNull || lowerList.length || upperList.length
          ? ["参数值", "上警戒线", "下警戒线"]
          : ["参数值"],
      textStyle: { color: "#fff" }, // Adjust for visibility if background is white
      selectedMode: false
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: tooltipFormatter
    },
    xAxis: {
      type: props.alarmRule === 2 ? "time" : "category",
      data: props.alarmRule === 2 ? undefined : data?.dateList,
      boundaryGap: false,
      axisLabel: {
        formatter: axisLabelFormatter,
        margin: 5
      }
    },
    yAxis: {
      type: "value",
      min: yAxisOption.min,
      // Logic from Image 3: calculate max if 0?
      max: (yAxisOption.max === 0 && yAxisOption.min === 0) 
           ? Math.max(...(dataList || []).map(Number)) 
           : yAxisOption.max,
      interval: yAxisOption.interval,
      axisLabel: {
        formatter: function (value) {
          return Number(value.toFixed(yAxisOption.precision));
        }
      },
      axisTick: { show: true },
      axisLine: { show: true },
      splitLine: { show: false }
    },
    series: [
      {
        name: "参数值",
        type: "line",
        itemStyle: {
          normal: { color: "#0aaeba" }
        },
        showSymbol: true,
        data: seriesData,
        markLine: {
          silent: true,
          symbol: "none",
          precision: yAxisOption.precision,
          data: markLineData
        }
      },
      // Upper Line Series (Only used for alarmRule == 2)
      {
        name: "上警戒线",
        type: "line",
        itemStyle: { normal: { color: "#fd0202" } },
        lineStyle: { type: "dashed" },
        data: upperList.map((ele) => [new Date(ele.timeStr || ele.date), ele.value])
      },
      // Lower Line Series (Only used for alarmRule == 2)
      {
        name: "下警戒线",
        type: "line",
        itemStyle: { normal: { color: "#fd0202" } },
        lineStyle: { type: "dashed" },
        data: lowerList.map((ele) => [new Date(ele.timeStr || ele.date), ele.value])
      }
    ]
  };

  myEcharts.value.setOption(option);
};

onMounted(() => {
  if (chartDom.value) {
    myEcharts.value = echarts.init(chartDom.value);
    updateChart();
  }
});

watch(
  () => props.data,
  () => {
    updateChart();
  },
  { deep: true }
);

watch(
  () => props.alarmRule,
  () => {
    updateChart();
  }
);
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
