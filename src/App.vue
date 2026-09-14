<template>
  <div class="app-shell">
    <!-- 当前展示表达式规则组件测试 -->
    <ExpressionRuleTest />

    <!--
      其他演示组件已注释，需要恢复时取消对应 import 和模板即可：
      <SocketIoAlarmBoard />
      <LuckysheetPivot1 />
      <PollingDashboard v-if="demoMode === 'before'" />
      <WebSocketDashboard v-else />
      <LineChart :data="chartData" :alarmRule="1" />
      <G2LineChart :data="chartData" :alarmRule="1" />
      <AlarmSettingForm />
      <DateRangeDemo />
      <AtreeTemplate />
      <StageBuilder />
      <TaskSchedulePicker v-model="taskCron" />
      <TaskSchedulePickerDetail v-model="taskCron" />
      <ButtonHeightDemo />
      <ContractInfoForm />
      <SearchDebounce />
      <TextEllipsisDemo />
      <RichTextEditor />
      <Detail />
      <CaseSearch />
      <SelectScrollLoad v-model="selectedOpt" :search-value="initSearchKey" />
    -->
  </div>
</template>

<script setup>
import ExpressionRuleTest from './components/ExpressionRuleTest.vue'

// import SocketIoAlarmBoard from './components/SocketIoAlarmBoard.vue'
// 旧的“自定义透视表”组件保留，方便对照：
// import LuckysheetPivot1 from './components/LuckysheetPivot1.vue'
// import LuckysheetPivot from './components/LuckysheetPivot.vue'

// 其他组件 import 已注释
// import { ref } from 'vue'
// import PollingDashboard from './components/PollingDashboard.vue'
// import WebSocketDashboard from './components/WebSocketDashboard.vue'
// const demoMode = ref('before')

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
// import SelectScrollLoad from './components/SelectScrollLoad.vue';
</script>

<style scoped>
.app-shell {
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  overflow: auto;
  background: #f0f2f5;
}

@media (max-width: 700px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
  }
}
</style>
