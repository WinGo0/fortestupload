<template>
  <div class="monitor-wrap">
    <div class="monitor-title">{{ vcConfigName }} 监控页面</div>
    <div class="container-chart" v-loading="chartLoading">
      <StackedLineGraph
        ref="chartRef"
        v-if="!chartLoading"
        :data="timeDataList"
        :legendSelected="false"
        :referenceParamCode="referenceParamCode"
        :selectedParamCodes="selectedParamCodes"
        class="line-graph"
      >
        <template #header>
          <el-select
            v-model="programId"
            placeholder="查询范围"
            class="chart-operate3"
            @change="handleAlarmChange"
          >
            <el-option
              v-for="item in proparamList || []"
              :key="item.id"
              :label="item.vcConfigName"
              :value="item.id"
            />
          </el-select>
          <!-- class="chart-select" -->
          <el-select
            v-model="selectTime"
            placeholder="查询范围"
            class="chart-operate2"
            style="width: 100px"
            @change="handleTimeChange"
          >
            <el-option
              v-for="item in timeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <el-dropdown
            class="chart-operate1"
            @command="(command) => handleCommand(command, index)"
          >
            <el-button :icon="Operation" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh"> 刷新 </el-dropdown-item>
                <el-dropdown-item command="saveAsImage">
                  下载趋势图
                </el-dropdown-item>
                <el-dropdown-item
                  command="setAxis"
                  :disabled="!referenceParamCode"
                >
                  参考坐标系设置
                </el-dropdown-item>
                <!-- <el-dropdown-item command="loadMainParam">
                  加载主坐标阈值
                </el-dropdown-item> -->
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <!-- <template #footer>
          <el-select
            v-model="selectTime"
            placeholder="查询范围"
            class="chart-select"
            style="width: 100px"
            @change="handleTimeChange"
          >
            <el-option
              v-for="item in timeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </template> -->
      </StackedLineGraph>
      <div v-if="!timeDataList || !timeDataList.length" class="empty">
        <div class="empty-container">
          <!-- 原项目图片资源不存在，先注释： -->
          <!-- <img src="@/assets/image/iconEmpty.svg" alt="暂无数据" /> -->
          <p>暂无数据</p>
        </div>
      </div>
    </div>
    <div class="table" ref="tabContainer">
      <el-tabs v-model="activeName">
        <el-tab-pane label="参数列表" name="first">
          <el-collapse
            v-if="paramList.length"
            class="dark-collapse-wrap"
            v-model="activeStage"
            accordion
            expand-icon-position="left"
            @change="handleCollapseChange"
          >
            <el-collapse-item
              v-for="(stage, index) in stagedParamList"
              :title="`第${stage.stageOrder}阶段`"
              :name="stage.stageOrder"
              :key="index"
            >
              <div class="system-list" v-if="stage.params.length">
                <template v-for="item in stage.params" :key="item.id">
                  <el-tooltip
                    v-if="item.paramName"
                    effect="light"
                    placement="top"
                    :content="item.paramName"
                  >
                    <div
                      :class="getVcMosaicStatus(item)"
                      @click="handleSelectParamBox(item)"
                      @contextmenu.prevent="
                        (e) => showContextMenu(e, item, true)
                      "
                    >
                      <div class="system-desc">
                        <div class="main-desc">
                          {{ item.paramCode }}
                        </div>
                        <div
                          v-if="item.paramName !== item.paramCode"
                          class="vice-desc"
                        >
                          {{ item.paramName }}
                        </div>
                      </div>
                    </div>
                  </el-tooltip>
                  <div
                    v-else
                    :class="getVcMosaicStatus(item)"
                    @click="handleSelectParamBox(item)"
                    @contextmenu.prevent="(e) => showContextMenu(e, item, true)"
                  >
                    <div class="system-desc">
                      <div class="main-desc">
                        {{ item.paramCode }}
                      </div>
                      <div
                        v-if="item.paramName !== item.paramCode"
                        :title="item.paramName"
                        class="vice-desc"
                      >
                        {{ item.paramName }}
                      </div>
                    </div>
                  </div>
                </template>
                <!-- 原项目 ContextMenu 组件不存在，先注释： -->
                <!-- <ContextMenu
                  v-if="showMenu"
                  :items="menuItems"
                  :position="menuPosition"
                  @close="closeContextMenu"
                /> -->
              </div>
            </el-collapse-item>
          </el-collapse>
          <div class="empty system-list-empty" v-else>
            <div class="empty-container">
              <!-- 原项目图片资源不存在，先注释： -->
              <!-- <img src="@/assets/image/iconEmpty.svg" alt="暂无数据" /> -->
              <p>暂无数据</p>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="报警记录" name="second">
          <!-- 原项目 AlarmList 组件不存在，先注释： -->
          <!-- <AlarmList
            v-if="activeName === 'second'"
            :programId="programId"
            :paramCodes="paramCodes"
            :timeOptions="timeOptions!"
          /> -->
        </el-tab-pane>
      </el-tabs>
    </div>
    <!-- 原项目 ParamDrawer 组件不存在，先注释： -->
    <!-- <ParamDrawer
      v-if="paramDetailShow"
      :selectData="paramDetailData"
      @drawerClose="paramDetailClose"
      disabled
    /> -->

    <!-- 原项目 ProgramDetailDrawer 组件不存在，先注释： -->
    <!-- <ProgramDetailDrawer
      v-if="programDetailShow"
      @drawerClose="programDetailClose"
      :id="programId"
    /> -->

    <el-dialog
      :before-close="handleClose"
      style="margin-top: 35vh !important"
      :close-on-click-modal="false"
      title="参考坐标系设置"
      v-model="setAxisVisiable"
      width="600px"
      align-center
      append-to-body
    >
      <el-form label-width="100px">
        <el-form-item
          :rules="[{ required: true, message: '值必填!' }]"
          label="Y轴值范围"
        >
          <el-input
            v-model.trim="axisMin"
            placeholder="最小值"
            maxlength="50"
            style="width: 200px"
          />
          <span>—</span>
          <el-input
            v-model.trim="axisMax"
            placeholder="最大值"
            maxlength="50"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer class="dialog-footer">
        <el-button type="primary" @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
// 原项目由自动导入插件提供这些 Vue API，新工程中改为显式导入。
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  ref,
} from "vue";
import { groupBy, orderBy, values, map, isEqual } from "lodash";
// import { downLoadFileByUrl } from "@/utils";
// import AlarmList from "./components/alarmList.vue";
/*
import {
  queryVcConfigParams,
  batchGetParamDataWithTimeRange,
  queryVcConfigByProcedureCode,
  batchQueryParamsDataByProcedureId,
  batchPullParamsDataWithCertainRate,
} from "@/api/variable";
import { getParamDetail } from "@/api/steadyStateConditions";
import { ParamsTimeData, RegulationParamsList } from "@/types/variable.d";
import { useGlobalStore } from "@/stores/globalState";
import { useRefreshRequest } from "@/composables/common/useRefreshRequest";
import { useRoute } from "vue-router";
import ParamDrawer from "@/views/configManagement/paramService/components/addDrawer.vue";
import ProgramDetailDrawer from "@/views/programManagement/variableConditions/components/detailDrawer.vue";
import ContextMenu from "@/components/contextMenu.vue";
import { Operation } from "@element-plus/icons-vue";
import { FormDetailData } from "@/types/paramService";
*/
import { useRoute } from "vue-router";
import { Operation } from "@element-plus/icons-vue";

// 原项目类型文件不存在，使用兼容类型避免脚本报错。
type ParamsTimeData = any;
type RegulationParamsList = any;
type FormDetailData = any;

// 原项目接口文件不存在，使用空数据请求占位，保持原有调用结构。
const emptyRequest = async () => ({ data: [] });
const queryVcConfigParams = emptyRequest;
const batchGetParamDataWithTimeRange = emptyRequest;
const queryVcConfigByProcedureCode = emptyRequest;
const batchQueryParamsDataByProcedureId = emptyRequest;
const batchPullParamsDataWithCertainRate = emptyRequest;
const getParamDetail = async () => ({ data: null });

// 原项目 refresh 组合式函数不存在，先留空，避免初始化时报错。
const useRefreshRequest = () => undefined;

// 原项目下载工具不存在，用浏览器原生下载能力兼容原调用。
const downLoadFileByUrl = (url: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
};

const StackedLineGraph = defineAsyncComponent(
  () => import("@/components/echarts/stackedLineGraph.vue"),
);

// 原项目 store 不存在，使用本地默认值替代原 globalStore。
// const globalStore = useGlobalStore();
// const { refreshTimer, timeOptions } = storeToRefs(globalStore);
const refreshTimer = ref(5000);
const timeOptions = ref<string[]>([]);
const unitId = ref(localStorage.getItem("unitCode") || "");

const route = useRoute();
// 当前路由procedureId
const activeName = ref<string>("first");
const tabContainer = ref();
const selectTime = ref<string>("");

// const programId = computed(() => route.query.id);
const programId = ref();
const proparamList = ref();
const setAxisVisiable = ref(false);
const axisMin = ref();
const axisMax = ref();

const procedureId = computed(() => {
  return route.query.procedureId as string;
});
const vcConfigName = computed(() => {
  return route.query.vcConfigName as string;
});

const paramCodes = computed(() => {
  return timeDataList.value?.map((it) => it.paramCode);
});

const chartRef = ref();
// 原始时序列表
const timeDataList = ref<ParamsTimeData[]>([]);
const chartLoading = ref(false);

const activeStage = ref("");
const lastActiveStage = ref("");
const paramList = ref<any[]>([]);
const selectedParamCodes = ref<any[]>([]);
// 参数详情抽屉
const paramDetailShow = ref<boolean>(false);
// 参数详情数据
const paramDetailData = ref<FormDetailData | null | any>();
// 方案详情抽屉
const programDetailShow = ref<boolean>(false);
// 将参数列表按阶段分组
const stagedParamList = computed(() =>
  map(groupBy(paramList.value, "stageOrder"), (items, stageOrder) => {
    return {
      stageOrder: stageOrder,
      params: items,
    };
  }),
);

const websocketEcharts = (newData: ParamsTimeData[]) => {
  const data: ParamsTimeData[] = [...timeDataList.value];
  if (!data.length) return;
  data.forEach((item) => {
    const matched = newData.find((child) => item.paramCode === child.paramCode);
    if (matched) {
      const res = duplicateRemoval(item.dataList, matched.dataList);
      item.dataList = item.dataList.concat(res);
      item.dataList.splice(0, res.length);
    } else {
      return item;
    }
  });
  // 更新图表数据
  timeDataList.value = data as [];
};
//实时数据对比去重
const duplicateRemoval = (oldList: any, newList: any) => {
  const mp = new Map();
  oldList.forEach((item) => {
    mp.set(item.timestamp, item);
  });
  const res: any = [];
  newList.forEach((item) => {
    const timestamp = mp.get(item.timestamp);
    if (!timestamp) {
      res.push(item);
    }
  });
  return res;
};

const showMenu = ref(false);
const currentContextParam = ref<any>(null);
const referenceParamCode = ref<any>(null);
const menuPosition = ref({ x: 0, y: 0 });
const menuItems = [
  {
    label: "设为参考坐标系",
    action: () => {
      console.log("设为参考坐标系");
      handleSetCoordinate();
    },
  },
  {
    label: "查看参数信息",
    action: () => {
      console.log("查看参数信息");
      handleShowParamDetail();
    },
  },
  {
    label: "查看方案配置",
    action: () => {
      console.log("查看方案配置");
      handleShowProgramDetail();
    },
  },
];
const showContextMenu = (e, item, flag) => {
  console.log("showContextMenu", e, item);
  menuPosition.value = {
    x: e.clientX,
    y: e.clientY,
  };
  showMenu.value = true;
  currentContextParam.value = item;
  // getParamData(
  //   item.paramCode,
  //   item.paramName,
  //   item.upperLimit,
  //   item.lowerLimit,
  //   flag,
  //   item.id,
  // );
};

const closeContextMenu = () => {
  showMenu.value = false;
  // currentContextParam.value = null;
};

const handleSetCoordinate = () => {
  console.log("handleSetCoordinate");
  referenceParamCode.value = currentContextParam.value.paramCode;
};

const handleShowParamDetail = async () => {
  const res: any = await getParamDetail({
    paramCode: currentContextParam.value!.paramCode,
    systemCode: currentContextParam.value!.value,
    unitId: unitId.value,
  });
  paramDetailData.value = res?.data || null;
  paramDetailShow.value = true;
};

const paramDetailClose = (needReload?: boolean) => {
  paramDetailData.value = null;
  paramDetailShow.value = false;
  // if (needReload) store.getPageList({ pageNum: pageNum.value });
};

const handleShowProgramDetail = async () => {
  programDetailShow.value = true;
};

const programDetailClose = () => {
  programDetailShow.value = false;
};

const handleTimeChange = async () => {
  console.log("handleTimeChange");
  getParamsTimeDataByProcedureId(false);
};

const refreshFn = async () => {
  // 刷新参数列表
  await getParamList();
  // 实时刷新曲线
  const res = await batchPullParamsDataWithCertainRate({
    unitId: unitId.value,
    paramCodesList: paramCodes.value,
    rate: `${refreshTimer.value / 1000}秒`,
  });
  websocketEcharts(res?.data || []);
};

// 实时刷新曲线数据
useRefreshRequest({
  asyncTask: async () => {
    await refreshFn();
  },
});

const handleSelectParamBox = (item) => {
  console.log("handleSelectParamBox", item);
  if (!selectedParamCodes.value.includes(item.paramCode)) {
    selectedParamCodes.value.push(item.paramCode);
  } else {
    selectedParamCodes.value = selectedParamCodes.value.filter(
      (it) => it !== item.paramCode,
    );
  }
};

//根据参数的状态修改class
const getVcMosaicStatus = (item) => {
  const classNames = ["mosaic-box"];
  if (item.hasAlarm) {
    classNames.push("mosaic-box-red");
  }
  if (selectedParamCodes.value.includes(item.paramCode)) {
    classNames.push("mosaic-box-selected");
  }
  return classNames.join(" ");
};

// 根据所选阶段设置已选paramCodes
const setSelectedParamCodes = () => {
  selectedParamCodes.value =
    stagedParamList.value
      .find((it) => it.stageOrder === activeStage.value)
      ?.params?.map((ele) => ele.paramCode) || [];
};

// 收缩栏始终有一个打开
const handleCollapseChange = async (value) => {
  console.log("handleCollapseChange", value, activeStage.value);
  if (value !== "" && value !== undefined && value !== null) {
    lastActiveStage.value = value;
    setSelectedParamCodes();
    referenceParamCode.value = null;
    await getParamsTimeDataByProcedureId(false);
    return;
  }
  await nextTick();
  activeStage.value = lastActiveStage.value;
  // setSelectedParamCodes();
  // await getParamsTimeDataByProcedureId(false);
};

//根据变工况方案id查询参数列表
async function getParamList(isFirst?: boolean) {
  try {
    // if (!route.query?.id) return ElMessage.error("缺少变工况方案Id!");
    const res: any = await queryVcConfigParams({
      // id: route.query.id,
      id: programId.value || "",
    });
    // 首次进页面 或者 参数列表发生变化
    if (isFirst || !isEqual(paramList.value, res.data)) {
      paramList.value = res?.data || [];
      paramList.value.sort((a, b) => a.stageOrder - b.stageOrder);
      const defaultStage = paramList.value?.[0]?.stageOrder || 1;
      activeStage.value = `${defaultStage}`;
      lastActiveStage.value = `${defaultStage}`;
      await nextTick();
      // 默认选中排序第一个阶段的参数
      setSelectedParamCodes();
      // 刷新模式且参数发生变化
      if (!isFirst) {
        await getParamsTimeDataByProcedureId(false);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

// 根据规程ID批量查询参数的时序数据
const getParamsTimeDataByProcedureId = async (isFirst) => {
  try {
    chartLoading.value = true;
    // const res = await batchQueryParamsDataByProcedureId({
    //   procedureId: procedureId.value,
    //   timeRange: selectTime.value || "",
    //   order: "paramUnit",
    // });
    const res = await batchGetParamDataWithTimeRange({
      paramCodesList: selectedParamCodes.value,
      unitId: unitId.value,
      timeRange: selectTime.value || "",
      order: "paramUnit",
    });

    timeDataList.value = res?.data || [];
  } catch (e) {
    console.log(e);
    chartLoading.value = false;
  } finally {
    chartLoading.value = false;
  }
};

const handleCommand = (command, index) => {
  const instance = chartRef.value?.getEchartInstance();
  console.log("handleCommand", command, index, chartRef.value, instance);

  if (command === "setAxis") {
    // handleTimeChange();
    setAxisVisiable.value = true;
  }
  if (command === "refresh") {
    handleTimeChange();
  }
  if (command === "saveAsImage") {
    const data = instance.getDataURL({
      type: "png",
      name: "echarts",
      pixelRatio: 2,
      backgroundColor: "#051431",
    });
    downLoadFileByUrl(data, `【${vcConfigName.value}】 方案详情曲线图`);
  }
};

const handleAlarmChange = async (item) => {
  getParamList();
};

const handleSearchProgrameList = async () => {
  try {
    const res = await queryVcConfigByProcedureCode({
      procedureCode: route.query.procedureId || "",
    });
    proparamList.value = res.data;
    if (route.query.queryFrom === "mosaicWall") {
      programId.value = proparamList.value?.[0].id || "";
    } else {
      // 从报警记录来的
      programId.value = Number(route.query.id);
    }
    // await getParamList(true);
  } catch (error) {
    console.log("error", error);
  }
};

const handleClose = () => {
  axisMin.value = "";
  axisMax.value = "";
  setAxisVisiable.value = false;
};
const handleConfirm = () => {
  axisMin.value = "";
  axisMax.value = "";
  setAxisVisiable.value = false;
};

onMounted(async () => {
  selectTime.value = timeOptions.value?.[0] || "";
  await handleSearchProgrameList();
  await getParamList(true);
  await getParamsTimeDataByProcedureId(true);
});
</script>

<style lang="scss" scoped>
.monitor-wrap {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  box-sizing: border-box;
  padding: 20px 12px 0;

  :deep(.el-tabs) {
    color: #fff;

    .el-tabs__item {
      color: #fff;
    }
  }

  .monitor-title {
    color: #fff;
    text-align: center;
    font-size: 18px;
  }

  .container-chart {
    position: relative;
    height: 80vh;
    margin-top: 25px;
    padding-right: 10px;

    .chart-select {
      position: absolute;
      bottom: 0;
      right: 10px;
      z-index: 10;
      width: 120px;
    }

    .chart-operate1 {
      position: absolute;
      top: -50px;
      right: 0;
      z-index: 10;
      width: 120px;
    }

    .chart-operate2 {
      position: absolute;
      top: -50px;
      right: 121px;
      z-index: 10;
      width: 120px;
    }

    .chart-operate3 {
      position: absolute;
      top: -50px;
      right: 222px;
      z-index: 10;
      width: 120px;
    }

    .line-graph {
      height: 100%;
    }
  }

  .table {
    width: 100%;
    overflow: auto;
    margin-bottom: 10px;

    .dark-collapse-wrap {
      background: transparent;

      :deep(.el-collapse) {
        background: transparent;
        border-top: none;
        border-bottom: none;
      }

      :deep(.el-collapse-item) {
        background: transparent;
      }

      :deep(.el-collapse-item__header) {
        background: transparent;
        color: #fff;
        border-bottom: 1px solid rgb(255 255 255 / 15%);
      }

      :deep(.el-collapse-item__wrap) {
        background: transparent;
        border-bottom: 1px solid rgb(255 255 255 / 15%);
      }

      :deep(.el-collapse-item__content) {
        background: transparent;
        color: #fff;
        padding: 16px;
      }

      :deep(.el-collapse-item__arrow) {
        color: #fff;
      }
    }

    .system-list {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      justify-content: start;
      max-height: 35vh;
      overflow-y: auto;
      padding: 20px 10px 10px;

      .mosaic-box {
        display: flex;
        height: 45px;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #fff;
        cursor: pointer;
        background: #6a6aed;
        border-radius: 5px;
      }

      .mosaic-box-selected {
        border: 1px solid #f2f2f2;
      }

      .mosaic-box-red {
        animation: blinker 1s linear infinite;
      }

      @keyframes blinker {
        0% {
          background-color: var(--alarm-color-red);
        }

        50% {
          background-color: #fff;
        }

        100% {
          background-color: var(--alarm-color-red);
        }
      }

      .mosaic-box-yellow {
        background: var(--alarm-color-orange);
      }

      .system-desc {
        display: flex;
        flex-direction: column;
        text-align: center;

        .main-desc {
          font-size: 14px;
        }

        .vice-desc {
          font-size: 12px;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .empty {
    width: 100%;
    height: 48vh;
    color: #666;
    background: #001529;
    margin: auto;
    position: relative;

    .empty-container {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      line-height: 1.5;
      text-align: center;
      font-size: 12px;
      padding: 30px 0;
    }
  }

  .system-list-empty {
    width: 100%;
    height: 32vh;
    color: #666;
  }

  :deep(.el-table__empty-block) {
    min-height: 35vh;
  }
}
</style>
