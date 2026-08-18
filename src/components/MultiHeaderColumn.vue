<template>
  <!-- 叶子列：直接绑定字段 -->
  <el-table-column
    v-if="!column.children || column.children.length === 0"
    :prop="column.prop"
    :label="column.label"
    :width="column.width"
    :min-width="column.minWidth"
    :align="column.align || 'center'"
    :fixed="column.fixed"
    show-overflow-tooltip
  >
    <template v-if="column.formatter" #default="{ row }">
      {{ column.formatter(row[column.prop], row) }}
    </template>
  </el-table-column>

  <!-- 父列：递归渲染子列 -->
  <el-table-column
    v-else
    :label="column.label"
    :align="column.align || 'center'"
  >
    <MultiHeaderColumn
      v-for="child in column.children"
      :key="child.prop || child.label"
      :column="child"
    />
  </el-table-column>
</template>

<script setup>
import MultiHeaderColumn from './MultiHeaderColumn.vue'

defineProps({
  column: {
    type: Object,
    required: true
  }
})
</script>
