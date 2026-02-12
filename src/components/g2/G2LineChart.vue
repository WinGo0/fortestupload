<template>
  <div ref="container" class="g2-chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Chart } from '@antv/g2';
import dayjs from 'dayjs';
import { isNil } from 'lodash';

/**
 * G2 Implementation of the Line Chart
 * G2 版本的折线图实现
 */

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  alarmRule: {
    type: Number,
    default: 1 // 1: Constant thresholds, 2: Curve thresholds
  },
  thresholdList: {
    type: Array,
    default: () => []
  }
});

const container = ref(null);
let chart = null;

// Reimplement calcYAxisOptions for consistency
const calcYAxisOptions = (dataList) => {
  if (!dataList || dataList.length === 0) return { min: 0, max: 100, tickCount: 5 };
  
  const validData = dataList
    .filter(v => !isNil(v) && v !== "" && !isNaN(Number(v)))
    .map(Number);
    
  if (validData.length === 0) return { min: 0, max: 100, tickCount: 5 };

  let min = Math.min(...validData);
  let max = Math.max(...validData);

  if (min === max) {
    if (max === 0) { max = 1; min = 0; }
    else { max *= 1.1; min *= 0.9; }
  } else {
    const range = max - min;
    const padding = range * 0.1;
    max += padding;
    min -= padding;
  }
  
  return { min, max, tickCount: 5 };
};

const renderChart = () => {
  if (!chart) {
    chart = new Chart({
      container: container.value,
      autoFit: true,
      theme: 'classicDark', 
      paddingLeft: 50,
      paddingRight: 30,
    });
  }

  const { data } = props;
  if (!data?.valueList) return;

  const chartData = [];
  const paramLabel = '参数值';
  const upperLabel = '上警戒线';
  const lowerLabel = '下警戒线';

  // 1. Data Transformation
  if (data.dateList && data.valueList) {
    data.dateList.forEach((dateStr, index) => {
      chartData.push({
        date: new Date(dateStr),
        value: Number(data.valueList[index]),
        type: paramLabel,
        // Add extra fields for tooltip
        paramCode: data.paramCode,
        paramName: data.paramName
      });
    });
  }

  // Threshold Data
  if (props.alarmRule === 2) {
    const processThreshold = (lines, label) => {
      lines?.forEach(item => {
        chartData.push({
          date: new Date(item.timeStr || item.date),
          value: Number(item.value),
          type: label
        });
      });
    };

    const upperLines = props.thresholdList?.find(it => it.paramCode?.includes("UpperLine"))?.dataList;
    const lowerLines = props.thresholdList?.find(it => it.paramCode?.includes("LowerLine"))?.dataList;

    processThreshold(upperLines, upperLabel);
    processThreshold(lowerLines, lowerLabel);
  }

  // 2. Clear & Config
  chart.clear();

  // Y-Axis Scale
  const allValues = chartData.map(d => d.value);
  if (props.alarmRule === 1) {
    if (!isNil(data.paramUpperLimit)) allValues.push(Number(data.paramUpperLimit));
    if (!isNil(data.paramLowerLimit)) allValues.push(Number(data.paramLowerLimit));
  }
  const yScales = calcYAxisOptions(allValues);

  chart
    .data(chartData)
    .scale('x', { type: 'time', mask: 'YYYY-MM-DD HH:mm:ss', tickCount: 8 })
    .scale('y', { domain: [yScales.min, yScales.max], tickCount: yScales.tickCount, nice: true })
    .scale('color', { 
      domain: [paramLabel, upperLabel, lowerLabel],
      range: ['#0aaeba', '#fd0202', '#fd0202'] 
    });

  // 3. Visual Encoding - Main Line (TEAL)
  chart.line()
    .encode('x', 'date')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('stroke', (d) => {
        if (d && d[0] && d[0].type === paramLabel) return '#0aaeba';
        return '#fd0202';
    })
    .style('shape', 'smooth') 
    .style('lineWidth', 2)
    .style('lineDash', (d) => {
      if (d && d[0] && (d[0].type === upperLabel || d[0].type === lowerLabel)) return [5, 5];
      return [0, 0];
    })
    .tooltip({
        title: (d) => dayjs(d.date).format('YYYY-MM-DD HH:mm:ss'),
        items: [
          { field: 'value', name: '值' },
          { field: 'paramCode', name: '编码' },
          { field: 'paramName', name: '名称' } 
        ]
    });
  
  // 3.1 Points (Markers) - Visible Teal Circles
  chart.point()
    .transform({ type: 'filter', callback: (d) => d.type === paramLabel })
    .encode('x', 'date')
    .encode('y', 'value')
    .encode('shape', 'point')
    .encode('size', 3)
    .style('fill', '#0aaeba')
    .style('stroke', '#fff')
    .style('lineWidth', 1)
    .tooltip(false);

  // 4. Annotations for Constant Thresholds
  if (props.alarmRule === 1) {
    if (!isNil(data.paramUpperLimit)) {
      chart.lineY()
        .data([Number(data.paramUpperLimit)])
        .encode('y', d => d)
        .style('stroke', '#fd0202')
        .style('lineDash', [5, 5])
        .style('lineWidth', 1)
        .label({
          text: upperLabel,
          position: 'right',
          dx: 5,
          style: { fill: '#fd0202', fontSize: 10 }
        });
    }
    if (!isNil(data.paramLowerLimit)) {
      chart.lineY()
        .data([Number(data.paramLowerLimit)])
        .encode('y', d => d)
        .style('stroke', '#fd0202')
        .style('lineDash', [5, 5])
        .style('lineWidth', 1)
        .label({
          text: lowerLabel,
          position: 'right',
          dx: 5,
          style: { fill: '#fd0202', fontSize: 10 }
        });
    }
  }

  // 5. Axes & Legend
  chart.axis('x', {
    title: false,
    labelFormatter: (d) => {
      try {
        const parts = dayjs(d).format("YYYY-MM-DD HH:mm:ss").split(' ');
        return parts.length > 1 ? `${parts[0]}\n${parts[1]}` : String(d);
      } catch (e) {
        return String(d);
      }
    },
    style: { textAlign: 'center' }
  });

  chart.axis('y', {
    title: false,
    grid: null, // Remove grid lines
  });

  chart.legend('color', {
    itemMarker: 'rect',
    position: 'top',
    layout: { justifyContent: 'center' } 
  });

  chart.render();
};

watch(() => [props.data, props.alarmRule], () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  renderChart();
  const resizeObserver = new ResizeObserver(() => chart?.forceFit());
  if (container.value) resizeObserver.observe(container.value);
  onUnmounted(() => resizeObserver.disconnect());
});

onUnmounted(() => {
  if (chart) chart.destroy();
});
</script>

<style scoped>
.g2-chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
