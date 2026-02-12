<template>
  <div class="date-range-demo">
    <h3>日期范围选择器 Demo</h3>
    <el-date-picker
      v-model="dateRange"
      type="datetimerange"
      range-separator="至"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
    />
    <div class="result" v-if="dateRange">
      <p>开始时间: {{ dateRange[0] }}</p>
      <p>结束时间: {{ dateRange[1] }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'

const now = dayjs()
const twoMonthsAgo = now.subtract(2, 'month')

const dateRange = ref([
  twoMonthsAgo.format('YYYY-MM-DD HH:mm:ss'),
  now.format('YYYY-MM-DD HH:mm:ss')
])
</script>

<style scoped>
.date-range-demo {
  padding: 20px;
}

h3 {
  color: #fff;
  margin-top: 0;
  margin-bottom: 15px;
}

.result {
  margin-top: 15px;
  color: #ccc;
  font-size: 14px;
}

.result p {
  margin: 4px 0;
}
</style>
