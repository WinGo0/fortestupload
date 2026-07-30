<template>
  <div class="container">
    <!-- <div class="chart-wrapper">
      <h3>ECharts Version</h3>
      <LineChart :data="chartData" :alarmRule="1" />
    </div> -->
    <!-- <div class="chart-wrapper">
      <h3>G2 Version</h3>
      <G2LineChart :data="chartData" :alarmRule="1" />
    </div> -->
    <!-- <div class="chart-wrapper">
      <h3>Alarm Settings</h3>
      <AlarmSettingForm />
    </div> -->

    <!-- 日期范围选择器演示 -->
    <!-- <div class="chart-wrapper" style="height: auto;">
      <DateRangeDemo />
    </div> -->
          <!-- <AtreeTemplate /> -->
        <!-- </div> -->

        <!-- <div class="chart-wrapper" style="height: auto; width: 1000px;"> -->
          <!-- <h3 style="color:#fff;">流程阶段编辑</h3>
          <StageBuilder /> -->

          <!--<div class="chart-wrapper" style="height: auto; width: 720px;">-->
<!--      <h3 style="color:#fff;">定时任务 - 频率与执行时间</h3>-->
<!--      <TaskSchedulePicker v-model="taskCron" />-->
<!--      <p style="color:#aaa;font-size:12px;margin-top:8px;">接口提交值：{{ taskCron }}</p>-->
<!--    </div>-->
    <!-- <TaskSchedulePickerDetail v-model="taskCron" /> -->
    <!-- 按钮高度演示 -->
    <!-- <div class="chart-wrapper" style="height: auto;">
      <ButtonHeightDemo />
    </div> -->

    <!-- 新增合同信息 -->
    <!-- <div class="chart-wrapper" style="height: auto; width: 1200px;">
      <ContractInfoForm />
    </div> -->

    <!-- 防抖演示 (新版) -->
    <!-- <div class="chart-wrapper" style="height: auto;">
      <SearchDebounce />
    </div> -->

    <!-- 文本省略演示 -->
    <!-- <div class="chart-wrapper" style="height: auto;">
      <TextEllipsisDemo />
    </div> -->

    <!-- 富文本 -->
    <!-- <div class="chart-wrapper">
      <RichTextEditor />
    </div> -->

    <!-- 富文本详情 -->
    <!-- <div class="chart-wrapper">
      <Detail />
    </div> -->

    <!-- 搜索病例展示 -->
    <!-- <div class="case-wrapper" style="flex: 1; width: 100%;">
      <CaseSearch />
    </div> -->

        <!-- 搜索病例展示 -->
    <!-- <div class="case-wrapper" style="flex: 1; width: 100%;">
      <AtreeTemplate />
    </div> -->

    <!-- <div class="chart-wrapper">
      <h3>Test Raw el-input-number with Precision 8</h3>
      <el-input-number v-model="testVal" :precision="8" :controls="false" />
      <div style="margin-top: 10px; color: #fff;">Value: {{ testVal }}</div>
    </div> -->

    <!-- el-select 下拉滚动加载 -->
    <div class="select-viewport">
      <SelectScrollLoad />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// import LineChart from './components/LineChart.vue';
// import G2LineChart from './components/g2/G2LineChart.vue';
// import DataImport from './components/DataImport.vue';
// import AlarmSettingForm from './components/AlarmSettingForm.vue';
// import RichTextEditor from './components/RichTextEditor.vue';
// import Detail from './components/Detail.vue';
// import TextEllipsisDemo from './components/TextEllipsisDemo.vue';
// import ButtonHeightDemo from './components/ButtonHeightDemo.vue';
// import DateRangeDemo from './components/DateRangeDemo.vue';
// import SearchDebounce from './components/SearchDebounce.vue';
// import CaseSearch from './components/CaseSearch.vue';
// import AtreeTemplate from './components/AtreeTemplate.vue';
// import ContractInfoForm from './components/ContractInfoForm.vue';
// import StageBuilder from './components/StageBuilder.vue';
// import TaskSchedulePicker from './components/TaskSchedulePicker.vue';
// import TaskSchedulePickerDetail from './components/TaskSchedulePickerDetail.vue';
// import { createDefaultCron } from './utils/taskSchedule.js';
import SelectScrollLoad from './components/SelectScrollLoad.vue';
import dayjs from 'dayjs';

const testVal = ref(1.2);
/** 提交接口的 Cron 字段 */
// const taskCron = ref(createDefaultCron());
const taskCron = ref({
  frequencyType: 'daily',
  weekDays: [],
  monthDays: [],
  intervalHours: 0,
  intervalMinutes: 30,
  intervalSeconds: 0,
  fixedTime: '08:00:00'
})

const chartData = ref({
  dateList: [],
  valueList: [],
  paramUpperLimit: 7.5,
  paramLowerLimit: 3,
  paramCode: 'P001',
  paramName: '示例参数'
});

const generateData = () => {
  const dates = [];
  const values = [];
  const now = dayjs();
  
  for (let i = 0; i < 20; i++) {
    dates.push(now.subtract(20 - i, 'minute').format('YYYY-MM-DD HH:mm:ss'));
    
    let val = 5; // Normal
    if (i >= 5 && i < 10) val = 8.5; // High (> 7.5) -> Red
    if (i >= 15) val = 1.5; // Low (< 3) -> Yellow
    
    values.push(val);
  }

  chartData.value = {
    ...chartData.value,
    dateList: dates,
    valueList: values
  };
};

onMounted(() => {
  generateData();
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;

.select-viewport {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
  gap: 20px;
  padding: 20px;
}

.chart-wrapper {
  flex: 1;
  width:1000px;
  /* height: 200px; */
  border: 1px solid #333;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

h3 {
  margin: 0 0 10px 0;
  color: #fff;
  font-size: 16px;
}
</style>
