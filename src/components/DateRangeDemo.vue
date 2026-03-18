<template>
  <div class="date-range-demo">
    <h3>日期范围选择器 (带校验与范围限制)</h3>
    <div class="search-bar">
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        :disabled-date="disabledDate"
      />
      <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">
        搜索
      </el-button>
    </div>
    
    <div class="result" v-if="dateRange && dateRange.length === 2">
      <p>开始时间: {{ dateRange[0] }}</p>
      <p>结束时间: {{ dateRange[1] }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const dateRange = ref([])
let now // 定义在外部
let twoMonthsAgo // 定义在外部

/**
 * 限制可选日期：只能选最近两个月以内
 */
const disabledDate = (time) => {
  // 如果接口还没返回，即 now 还没赋值，先不限制或返回 false 避免报错
  if (!now) return false 
  
  const date = dayjs(time)
  // 限制逻辑：超过两个月前 或 超过今天
  return date.isBefore(twoMonthsAgo.startOf('day')) || date.isAfter(now, 'day')
}

/**
 * 初始化日期范围
 */
const initDateRange = async () => {
  try {
    // 模拟接口获取当前时间
    const mockFetchTime = () => new Promise(resolve => setTimeout(() => resolve(new Date()), 300))
    const serverTime = await mockFetchTime()
    
    // 给外部变量赋值
    now = dayjs(serverTime)
    twoMonthsAgo = now.subtract(2, 'month')

    // 设置默认范围
    dateRange.value = [
      twoMonthsAgo.format('YYYY-MM-DD HH:mm:ss'),
      now.format('YYYY-MM-DD HH:mm:ss')
    ]
  } catch (error) {
    console.error('获取服务器时间失败:', error)
    now = dayjs()
    twoMonthsAgo = now.subtract(2, 'month')
    dateRange.value = [
      twoMonthsAgo.format('YYYY-MM-DD HH:mm:ss'),
      now.format('YYYY-MM-DD HH:mm:ss')
    ]
  }
}

/**
 * 搜索逻辑判断
 */
const handleSearch = () => {
  // 1. 判断日期不能为空
  if (!dateRange.value || dateRange.value.length === 0) {
    ElMessage.warning('日期不能为空，请选择时间范围')
    return
  }

  console.log('执行搜索，范围:', dateRange.value)
  ElMessage.success('搜索中...')
}

onMounted(() => {
  initDateRange()
})
</script>

<style scoped>
.date-range-demo {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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
