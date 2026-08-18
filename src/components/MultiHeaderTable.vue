<template>
  <div class="multi-header-table">
    <div class="table-title">动态多级表头表格</div>
    <div class="table-desc">列定义支持动态嵌套，数据支持多行展示</div>

    <el-table
      :data="tableData"
      border
      stripe
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
      :cell-style="{ padding: '8px 0' }"
      max-height="560"
    >
      <MultiHeaderColumn
        v-for="col in columns"
        :key="col.prop || col.label"
        :column="col"
      />
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MultiHeaderColumn from './MultiHeaderColumn.vue'

// 动态多级表头定义：支持任意层级的 children 嵌套
const columns = ref([
  {
    prop: 'index',
    label: '序号',
    width: 70,
    align: 'center'
  },
  {
    label: '基本信息',
    align: 'center',
    children: [
      { prop: 'name', label: '姓名', width: 100 },
      { prop: 'dept', label: '部门', width: 120 },
      { prop: 'role', label: '岗位', width: 120 }
    ]
  },
  {
    label: '联系方式',
    align: 'center',
    children: [
      { prop: 'phone', label: '电话', minWidth: 130 },
      { prop: 'email', label: '邮箱', minWidth: 180 }
    ]
  },
  {
    label: '季度绩效（万元）',
    align: 'center',
    children: [
      {
        label: '上半年',
        align: 'center',
        children: [
          { prop: 'q1', label: 'Q1', width: 90 },
          { prop: 'q2', label: 'Q2', width: 90 }
        ]
      },
      {
        label: '下半年',
        align: 'center',
        children: [
          { prop: 'q3', label: 'Q3', width: 90 },
          { prop: 'q4', label: 'Q4', width: 90 }
        ]
      }
    ]
  },
  {
    label: '年度汇总',
    align: 'center',
    children: [
      {
        prop: 'total',
        label: '总销售额',
        width: 110,
        formatter: (val) => Number(val).toFixed(2)
      },
      {
        prop: 'status',
        label: '评级',
        width: 80,
        formatter: (val) => {
          const map = { excellent: '优秀', good: '良好', normal: '一般' }
          return map[val] || val
        }
      }
    ]
  }
])

// 多行数据
const tableData = ref([
  { index: 1, name: '张三', dept: '销售一部', role: '经理', phone: '13800138001', email: 'zhangsan@example.com', q1: 12.5, q2: 15.3, q3: 14.8, q4: 18.2, total: 60.8, status: 'excellent' },
  { index: 2, name: '李四', dept: '销售一部', role: '主管', phone: '13800138002', email: 'lisi@example.com', q1: 10.2, q2: 11.6, q3: 13.4, q4: 14.5, total: 49.7, status: 'good' },
  { index: 3, name: '王五', dept: '销售二部', role: '专员', phone: '13800138003', email: 'wangwu@example.com', q1: 8.4, q2: 9.1, q3: 10.5, q4: 11.3, total: 39.3, status: 'normal' },
  { index: 4, name: '赵六', dept: '销售二部', role: '经理', phone: '13800138004', email: 'zhaoliu@example.com', q1: 15.6, q2: 16.8, q3: 17.2, q4: 19.5, total: 69.1, status: 'excellent' },
  { index: 5, name: '孙七', dept: '市场部', role: '专员', phone: '13800138005', email: 'sunqi@example.com', q1: 7.8, q2: 8.5, q3: 9.2, q4: 10.1, total: 35.6, status: 'normal' },
  { index: 6, name: '周八', dept: '市场部', role: '主管', phone: '13800138006', email: 'zhouba@example.com', q1: 11.3, q2: 12.7, q3: 13.1, q4: 14.8, total: 51.9, status: 'good' },
  { index: 7, name: '吴九', dept: '技术部', role: '工程师', phone: '13800138007', email: 'wujiu@example.com', q1: 9.5, q2: 10.4, q3: 11.8, q4: 12.6, total: 44.3, status: 'good' },
  { index: 8, name: '郑十', dept: '技术部', role: '经理', phone: '13800138008', email: 'zhengshi@example.com', q1: 13.2, q2: 14.5, q3: 15.7, q4: 16.9, total: 60.3, status: 'excellent' }
])
</script>

<style scoped>
.multi-header-table {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.table-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.table-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
}
</style>
