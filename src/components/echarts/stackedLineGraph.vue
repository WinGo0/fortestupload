<template>
  <div
    class="stackedLineGraph"
    v-loading="chartLoading"
    element-loading-background="rgba(0,0,0,0.5)"
  >
    <!-- <ECharts ref="echartsRef" :option="chartOption" :resize="false" /> -->
    <div ref="echartsRef" class="chart" :style="echartsStyle"></div>
    <div v-if="$slots.header" class="echart-header">
      <slot name="header" />
    </div>
    <div v-if="$slots.footer" class="echart-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts" setup>
// 原项目由自动导入插件提供这些 Vue API，新工程中改为显式导入。
import {
  computed,
  markRaw,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import type { Ref } from "vue";
import * as echarts from "echarts";
import { isNil, isEqual } from "lodash";
import dayjs from "dayjs";
// import { ECOption } from "./config";
// import { ParamsTimeData } from "@/types/variable.d";
// import { useEchartDynamicColors } from "@/composables/common/useEchartDynamicColors";

// 原项目配置和类型文件不存在，使用兼容类型避免脚本报错。
type ECOption = any;
type ParamsTimeData = any;

// 原项目动态颜色 composable 不存在，提供等价的最小本地实现。
const defaultColorList = [
  "#5b8ff9",
  "#5ad8a6",
  "#f6bd16",
  "#e8684a",
  "#6dc8ec",
  "#9270ca",
];
const colorList = ref<string[]>([]);
const getDynamicColorList = (length: number) => {
  colorList.value = Array.from(
    { length },
    (_, index) => defaultColorList[index % defaultColorList.length],
  );
};

const props = withDefaults(
  defineProps<{
    data: ParamsTimeData[];
    scene?: string;
    legendSelected?: boolean;
    referenceParamCode?: string;
    mainAxisMin?: number | string | null;
    mainAxisMax?: number | string | null;
    selectedParamCodes?: string[];
    height?: number;
    width?: number;
  }>(),
  {
    data: () => [],
    scene: "",
    legendSelected: true,
  },
);
const echartsRef: Ref<HTMLElement | null> = ref(null);
const echartsInstance = shallowRef<echarts.ECharts | null>(null);
const chartLoading = ref(false);
// const { colorList, getDynamicColorList } = useEchartDynamicColors();
// 是否上下限
const isUpperLine = (paramCode) => paramCode.includes("UpperLine");
const isLowerLine = (paramCode) => paramCode.includes("LowerLine");
// 上下限颜色
const upperColor = "#fd0202";
const lowerColor = "#ffe00f";
const defaultAxisLabelColor = "#606266";
const minPlotWidth = 1000;
const lineWidthRatio = 90;
const minGridLeft = 90;
const yAxisSpace = 90;
// 获取图例名
const getLegendName = (paramCode) => {
  // return isUpperLine(paramCode)
  //   ? "上警戒线"
  //   : isLowerLine(paramCode)
  //   ? "下警戒线"
  //   : paramCode;
  return paramCode;
};
const getTimeValue = (timeStr) => dayjs(timeStr).valueOf();
const formatTimeLabel = (value) => dayjs(value).format("YYYY-MM-DD HH:mm:ss");
// y轴展示格式化
const formatYAxisLabel = (value) => `${value}`;
const legends = computed<string[]>(() => {
  return props.data?.map((it) => getLegendName(it.paramCode));
});
const formatTooltipValue = (value) => {
  if (Array.isArray(value)) {
    const pointValue = value[1];
    return `${pointValue}`;
  }
  return `${value}`;
};
const formatYAxis = (unit = "") => {
  const chars = unit ? Array.from(unit) : [""];
  return chars.length > 8 ? `${chars.slice(0, 10).join("")}...` : unit;
};
const echartsStyle = computed(() => {
  // return props.height
  //   ? { height: props.height + "px", width: `${chartWidth.value}px` }
  //   : { height: "100%", width: `${chartWidth.value}px` };
  return { height: "100%", width: "100%" };
});
const chartOption = ref<ECOption>({});
const selectedLegends = ref<string[]>([]);

const rawUnitList = computed(() => {
  const units = Array.from(new Set(props.data.map((it) => it.paramUnit)));
  return units.length ? units : [];
});

const referenceItem = computed(() =>
  props.data.find((it) => it.paramCode === props.referenceParamCode),
);
const hasMainAxis = computed(() =>
  Boolean(props.referenceParamCode && referenceItem.value),
);

const toFiniteNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const mainAxisMin = computed(() => toFiniteNumber(props.mainAxisMin));
const mainAxisMax = computed(() => toFiniteNumber(props.mainAxisMax));
const hasValidMainRange = computed(
  () =>
    hasMainAxis.value &&
    mainAxisMin.value !== null &&
    mainAxisMax.value !== null &&
    mainAxisMin.value < mainAxisMax.value,
);

const mainUnit = computed(
  () => referenceItem.value?.paramUnit ?? rawUnitList.value?.[0] ?? undefined,
);

const unitList = computed(() => {
  if (!hasMainAxis.value) return rawUnitList.value;
  // 参考坐标系模式下仅保留右侧参考Y轴，其余左侧Y轴不再展示，
  // 其余参数的曲线通过 unitAxisIndexMap 回落到索引 0 共用该轴。
  return [mainUnit.value];
});

// 当前工程使用 ECharts 6；空数据时保留一根占位轴，避免 yAxis 为空报错。
const displayUnitList = computed(() =>
  unitList.value.length ? unitList.value : [""],
);

const unitAxisIndexMap = computed(
  () => new Map(unitList.value.map((unit, index) => [unit, index])),
);

const leftAxisCount = computed(() =>
  hasMainAxis.value
    ? Math.max(unitList.value.length - 1, 0)
    : unitList.value.length,
);

const gridLeft = computed(() =>
  Math.max(minGridLeft, leftAxisCount.value * yAxisSpace),
);

const gridRight = computed(() => (hasMainAxis.value ? yAxisSpace : 30));

const plotWidth = computed(() =>
  Math.max(minPlotWidth, 720 + props.data.length * lineWidthRatio),
);

const chartWidth = computed(
  () => plotWidth.value + gridLeft.value + gridRight.value,
);
const colorArr = computed(() => colorList.value || []);

const getSeriesColor = (item, index) => {
  if (isUpperLine(item.paramCode)) return upperColor;
  if (isLowerLine(item.paramCode)) return lowerColor;
  return colorArr.value[index];
};

const noUnitColorMap = computed(() => {
  const colorMap = new Map<string, string>();
  props.data.forEach((it, index) => {
    if (!it.paramUnit && !colorMap.has(it.paramUnit)) {
      colorMap.set(it.paramUnit, getSeriesColor(it, index));
    }
  });
  return colorMap;
});

const paramUnitMap = computed(
  () => new Map(props.data.map((it) => [it.paramCode, it.paramUnit])),
);
const visibleParamCodeSet = computed(
  () =>
    new Set(props.selectedParamCodes ?? props.data.map((it) => it.paramCode)),
);
const selectedLegend = computed(() => {
  return props.data.reduce((selected, item) => {
    selected[item.paramCode] = visibleParamCodeSet.value.has(item.paramCode);
    return selected;
  }, {});
});
const tooltipFormatter = (params) => {
  const paramList = Array.isArray(params) ? params : [params];
  const firstParam = paramList[0];
  const title = firstParam?.axisValue
    ? formatTimeLabel(firstParam.axisValue)
    : "";
  const content = paramList
    .map((param) => {
      const item = param;
      const unit = item.seriesName
        ? paramUnitMap.value.get(item.seriesName) || ""
        : "";
      return `${item.marker || ""}${
        item.seriesName || ""
      }: ${formatTooltipValue(item.value)}${unit ? ` / ${unit}` : ""}`;
    })
    .join("<br />");
  return title ? `${title}<br />${content}` : content;
};

const calculateChartOption = () => {
  chartLoading.value = true;
  const seriesData = props.data;
  selectedLegends.value =
    props.data?.map((it, index) => legends.value[index]) || [];

  console.log("colorList", colorArr.value);

  // const upperList: any[] =
  //   props.data
  //     ?.find((it) => isUpperLine(it.paramCode))
  //     ?.dataList?.map((ele) => ele.value) || [];
  // const lowerList: any[] =
  //   props.data
  //     ?.find((it) => isLowerLine(it.paramCode))
  //     ?.dataList?.map((ele) => ele.value) || [];
  let dataZoomStart = 0;
  // 参数点位超过1000时，缩放组件定位到最新1/5
  if (seriesData.some((it) => it.dataList.length > 1000)) {
    dataZoomStart = 80;
  }
  const options: ECOption = {
    color: colorArr.value,
    legend: {
      data: legends.value,
      textStyle: {
        color: props.scene == "detail" ? "#000" : "#fff",
      },
      selectedMode: props.legendSelected,
      selected: selectedLegend.value,
    },
    tooltip: {
      axisPointer: {
        type: "cross",
      },
      formatter: tooltipFormatter,
    },
    grid: {
      left: gridLeft.value,
      right: gridRight.value,
      bottom: "15%", // 增加底部空间以容纳缩放组件
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      // type: "category",
      // data: seriesData?.[0]?.dataList?.map((it) => it.timeStr) || [],
      boundaryGap: false, // 让X轴从第一个数据点开始
      type: "time",
      axisLabel: {
        rotate: 10,
        // formatter: "{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}",
        formatter: formatTimeLabel,
        margin: 5,
        // hideOverLap: true,
        // rotate: 45,
      },
      axisPointer: {
        label: {
          formatter: (params) => formatTimeLabel(params.value),
        },
      },
    },
    yAxis: displayUnitList.value.map((unit, index) => {
      const isMainAxis = hasMainAxis.value && index === 0;
      return {
        type: "value",
        name: formatYAxis(unit),
        // 只有1条y轴且未设置为参考坐标系时默认左边展示，设置为参考坐标系右边展示
        position: isMainAxis ? "right" : "left",
        offset: hasMainAxis.value
          ? index <= 1
            ? 0
            : (index - 1) * yAxisSpace
          : index * yAxisSpace,
        // 未手动设置范围时由 ECharts 自动缩放，保证共轴的各条曲线都能显示
        ...(isMainAxis && hasValidMainRange.value
          ? { min: mainAxisMin.value, max: mainAxisMax.value }
          : {}),
        alignTicks: false,
        axisLine: {
          show: false, // 显示Y轴轴线（竖线）
        },
        axisTick: {
          show: false, // 确保刻度线可见（默认就是 true，无需显式配置）
        },
        axisLabel: {
          rotate: 0,
          margin: 10,
          showMinLabel: true,
          showMaxLabel: true,
          color: defaultAxisLabelColor,
          // color: unit
          //   ? defaultAxisLabelColor
          //   : noUnitColorMap.value.get(unit) || defaultAxisLabelColor,
          formatter: (value) => formatYAxisLabel(value),
        },
        nameTextStyle: {
          color: defaultAxisLabelColor,
          align: isMainAxis ? "left" : "right",
          padding: isMainAxis ? [0, 0, 0, 8] : [0, 8, 0, 0],
        },
      };
    }),
    // yAxis: seriesData?.map((item: any, index) => {
    //   const dataList =
    //     !isNil(item.lowerLimit) && !isNil(item.upperLimit)
    //       ? [
    //           ...item.dataList.map((it) => it.value),
    //           item.lowerLimit,
    //           item.upperLimit,
    //         ]
    //       : item.dataList.map((it) => it.value);
    //   const yAxisOption = calcYAxisOptions(
    //     [...dataList, ...lowerList, ...upperList],
    //     0,
    //   );
    //   return {
    //     type: "value",
    //     // name: `${item.paramCode} / ${item.paramUnit}`,
    //     // nameLocation: "center",
    //     position: index % 2 === 0 ? "left" : "right",
    //     offset: 20 * index,
    //     // interval: yAxisOption.interval,
    //     axisLabel: {
    //       rotate: 45,
    //       // show: selectedLegends.value?.includes(legends.value[index]),
    //       margin: 20,
    //       showMinLabel: true,
    //       showMaxLabel: true,
    //       color: item.paramCode?.includes("UpperLine")
    //         ? "#fd0202"
    //         : item.paramCode?.includes("LowerLine")
    //         ? "#ffe00f"
    //         : colorArr[index],
    //       formatter: function (value, index, extra) {
    //         return `${value.toFixed(yAxisOption.decimalPlaces)}${
    //           item.paramUnit ? ` / ${item.paramUnit}` : ""
    //         }`;
    //       },
    //     },
    //     axisTick: {
    //       show: false, // 确保刻度线可见（默认就是 true，无需显式配置）
    //     },
    //     axisLine: {
    //       show: false, // 显示Y轴轴线（竖线）
    //     },
    //     splitLine: {
    //       show: false,
    //     },
    //   };
    // }),
    series: seriesData?.map((it: any, index) => ({
      name: legends.value[index],
      type: "line",
      yAxisIndex: unitAxisIndexMap.value.get(it.paramUnit) ?? 0,
      clip: true,
      connectNulls: false,
      // stack: "Total",
      // data: it.dataList?.map((ele) => ele.value) || [],
      data:
        it.dataList
          ?.slice()
          ?.sort((a, b) => getTimeValue(a.timeStr) - getTimeValue(b.timeStr))
          ?.map((ele) => [new Date(ele.timeStr), ele.value]) || [],
      // colorBy: "data",
      markLine:
        seriesData?.length == 1 &&
        !isNil(it.lowerLimit) &&
        !isNil(it.upperLimit)
          ? {
              symbol: "none",
              label: {
                show: true,
                position: "insideEndTop",
                color: "inherit",
                fontSize: 14,
                formatter: function (params) {
                  console.log("markLine params", params);
                  return `${params.value}${
                    it.paramUnit ? ` / ${it.paramUnit}` : ""
                  }`;
                },
              },
              data: [
                {
                  name: "上警戒线",
                  yAxis: it.upperLimit,
                  lineStyle: {
                    color: upperColor,
                  },
                },
                {
                  name: "下警戒线",
                  yAxis: it.lowerLimit,
                  lineStyle: {
                    color: lowerColor,
                  },
                },
              ],
            }
          : {
              symbol: "none",
              data: [],
            },
      lineStyle: {
        type:
          isUpperLine(it.paramCode) || isLowerLine(it.paramCode)
            ? "dashed"
            : "solid",
      },
      // 上下限之外的点展示不同颜色
      itemStyle: isUpperLine(it.paramCode)
        ? { color: upperColor }
        : isLowerLine(it.paramCode)
        ? { color: lowerColor }
        : props.data.length === 1 &&
          !isNil(it.lowerLimit) &&
          !isNil(it.upperLimit)
        ? {
            color: function (params) {
              const value = params!.value?.[1];
              return value > it.upperLimit
                ? upperColor
                : value < it.lowerLimit
                ? lowerColor
                : getSeriesColor(it, index);
            },
          }
        : {
            color: getSeriesColor(it, index),
          },
    })),
    dataZoom: [
      {
        type: "slider",
        start: dataZoomStart,
        end: 100,
      },
    ],
    visualMap: seriesData?.map((it: any, index) => {
      return seriesData.length === 1 &&
        !isNil(it.lowerLimit) &&
        !isNil(it.upperLimit)
        ? {
            show: false,
            // dimension: 0,
            pieces: [
              // 超出上警戒线的部分
              {
                gt: it.upperLimit,
                color: upperColor,
              },
              // 低于下警戒线的部分
              {
                lt: it.lowerLimit,
                color: lowerColor,
              },
              // 正常范围的部分
              {
                gte: it.lowerLimit,
                lte: it.upperLimit,
                // color: "#0aaeba",
                // color: getSeriesColor(it, index),
              },
            ],
          }
        : null;
    }),
  };

  console.log("stackedLineGraph options", options, echartsInstance.value);
  chartOption.value = { ...options };
  if (!echartsInstance.value) return;
  echartsInstance.value.setOption(chartOption.value, {
    replaceMerge: ["yAxis", "series"],
  });
  if (!props.legendSelected) {
    nextTick(() => {
      setLegendByParamCodes();
    });
  }
  chartLoading.value = false;
};

const setLegendByParamCodes = () => {
  const selectedLegends = props.selectedParamCodes.map((it) =>
    getLegendName(it),
  );
  if (!echartsInstance.value) return;
  legends.value.forEach((legendName) => {
    // if (["上警戒线", "下警戒线"].includes(legendName)) return;
    if (selectedLegends.includes(legendName)) {
      echartsInstance.value!.dispatchAction({
        type: "legendSelect",
        name: legendName,
      });
    } else {
      echartsInstance.value!.dispatchAction({
        type: "legendUnSelect",
        name: legendName,
      });
    }
  });
};

const init = () => {
  if (!echartsRef.value) {
    return;
  }
  if (!echartsInstance.value) {
    echartsInstance.value = markRaw(echarts.init(echartsRef.value));
    echartsInstance.value.setOption(chartOption.value);
  }
};

// 监听 props.data 的变化
watch(
  [
    () => props.data,
    () => props.referenceParamCode,
    () => props.mainAxisMin,
    () => props.mainAxisMax,
    () => props.selectedParamCodes,
  ],
  async (
    [newData, newReferenceParamCode],
    [oldData, oldReferenceParamCode],
  ) => {
    const oldParams = oldData?.map((it) => it.paramCode) || [];
    const newParams = newData?.map((it) => it.paramCode) || [];
    // 只在第一次时生成颜色
    if (!isEqual(oldParams, newParams)) {
      // 动态获取折线图颜色列表
      getDynamicColorList(props.data?.length || 0);
    }
    console.log(
      "stackedLineGraph watch",
      newData.map((it) => it.paramCode),
      oldData?.map((it) => it.paramCode),
      props.data,
      props.referenceParamCode,
    );
    await nextTick();
    calculateChartOption(); // 当数据变化时，更新图表
  },
  {
    deep: true,
    immediate: true,
  }, // 深度监听，确保对象内部的变化也能被检测到
);
// 选中参数变化时，切换图例状态
// watch(
//   () => props.selectedParamCodes,
//   (newVal) => {
//     // 图例不可点击时，通过传入的props.selectParamCodes控制图例和曲线展示
//     !props.legendSelected && setLegendByParamCodes();
//   },
//   {
//     deep: true,
//     immediate: true,
//   },
// );

onMounted(() => {
  console.log(
    "stackedLineGraph onMounted",
    echartsRef.value,
    echartsInstance.value,
  );
  init();
});

defineExpose({
  getEchartInstance: () => echartsInstance.value,
});
</script>
<style lang="scss" scoped>
.stackedLineGraph {
  position: relative;
  height: 100%;
  width: 100%;
}

.chart-footer {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 10;
  width: 120px;
}

.chart-header {
  position: absolute;
  top: -50px;
  right: 0;
  z-index: 10;
  width: 120px;
}
</style>
