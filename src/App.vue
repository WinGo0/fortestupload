<template>
  <div class="app-shell">
    <header class="demo-toolbar">
      <div class="demo-title">
        <p class="demo-eyebrow">Dashboard Demo</p>
        <h1>定时轮询 vs Socket.IO</h1>
      </div>

      <el-radio-group v-model="demoMode" size="large">
        <el-radio-button value="before">改前：定时轮询</el-radio-button>
        <el-radio-button value="after">改后：Socket.IO</el-radio-button>
      </el-radio-group>
    </header>

    <main class="demo-stage">
      <PollingDashboard v-if="demoMode === 'before'" />
      <!-- 真实后端接入时给 WebSocketDashboard 传 socket-url，例如：
           <WebSocketDashboard socket-url="https://example.com" :auto-reconnect="true" /> -->
      <WebSocketDashboard v-else />
    </main>

    <!--
      其他演示组件已注释，需要恢复时取消对应 import 和模板即可：
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
import { ref } from 'vue'
import PollingDashboard from './components/PollingDashboard.vue'
import WebSocketDashboard from './components/WebSocketDashboard.vue'

// 其他组件 import 已注释
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

const demoMode = ref('before')
</script>

<style scoped>
.app-shell {
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: #0e1012;
}

.demo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.demo-title {
  min-width: 260px;
}

.demo-eyebrow {
  margin: 0 0 4px;
  color: #22d3ee;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  color: #f5f7fa;
  font-size: 22px;
  line-height: 1.2;
}

.demo-stage {
  flex: 1;
  min-height: 0;
}

.demo-toolbar :deep(.el-radio-group) {
  --el-text-color-regular: #d7dce3;
  --el-border-color: #3a4048;
  --el-border-color-hover: #2dd4bf;
}

.demo-toolbar :deep(.el-radio-button__inner) {
  background: #17191d;
  color: #aeb6c0;
  border-color: #343941;
  box-shadow: none;
}

.demo-toolbar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #20242a;
  color: #2dd4bf;
  border-color: #2dd4bf;
}

@media (max-width: 700px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .demo-toolbar {
    align-items: flex-start;
  }
}
</style>
