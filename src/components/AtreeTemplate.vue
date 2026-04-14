<template>
  <div class="tree-container">
    <a-input-search
      v-model:value="searchValue"
      style="margin-bottom: 8px"
      placeholder="搜索节点..."
    />
    
    <div v-if="loading" class="loading-state">
      <a-spin tip="数据加载中..." />
    </div>

    <a-tree
      v-else
      v-model:checkedKeys="checkedKeys"
      v-model:expandedKeys="expandedKeys"
      :tree-data="treeData"
      :field-names="fieldNames"
      checkable
      :check-strictly="false"
      show-line
      block-node
      :auto-expand-parent="autoExpandParent"
      @check="onCheck"
      @expand="onExpand"
    >
      <template #title="{ name }">
        <span v-if="name.indexOf(searchValue) > -1">
          {{ name.substring(0, name.indexOf(searchValue)) }}
          <span style="color: #f50">{{ searchValue }}</span>
          {{ name.substring(name.indexOf(searchValue) + searchValue.length) }}
        </span>
        <span v-else>{{ name }}</span>
      </template>
    </a-tree>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

// 字段映射配置：贴合实际后端返回的字段名
const fieldNames = {
  children: 'subNodes',
  title: 'name',
  key: 'id',
}

const treeData = ref([])
const checkedKeys = ref([])
const expandedKeys = ref([])
const searchValue = ref('')
const autoExpandParent = ref(true)
const loading = ref(true)

// 模拟后端接口返回的数据（字段名不固定）
const fetchTreeData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = [
        {
          name: '系统管理',
          id: 'sys-001',
          subNodes: [
            { name: '用户管理', id: 'user-001' },
            { name: '角色管理', id: 'role-001' },
            { 
              name: '权限配置', 
              id: 'perm-001',
              subNodes: [
                { name: '查看权限', id: 'perm-view' },
                { name: '编辑权限', id: 'perm-edit' }
              ]
            }
          ]
        },
        {
          name: '业务模块',
          id: 'biz-001',
          subNodes: [
            { name: '合同管理', id: 'contract-001' },
            { name: '报表统计', id: 'report-001' }
          ]
        }
      ]
      const initialCheckedKeys = ['user-001', 'perm-view'] 
      resolve({ data, initialCheckedKeys })
    }, 800)
  })
}

onMounted(async () => {
  try {
    const { data, initialCheckedKeys } = await fetchTreeData()
    treeData.value = data
    checkedKeys.value = initialCheckedKeys
    // 默认展开所有一级节点
    expandedKeys.value = data.map(item => item.id)
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    loading.value = false
  }
})

// 搜索逻辑：自动展开匹配到的父节点
const onExpand = (keys) => {
  expandedKeys.value = keys
  autoExpandParent.value = false
}

// 选中回调
const onCheck = (checkedKeysValue, info) => {
  console.log('完全选中:', checkedKeysValue)
  console.log('半选父级:', info.halfCheckedKeys)
}

// 监听搜索变化
watch(searchValue, value => {
  if (!value) return
  // 实际业务中这里可以做递归搜索来高亮或筛选
})
</script>

<style scoped>
.tree-container {
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  max-width: 500px;
}
.loading-state {
  padding: 40px;
  text-align: center;
}
</style>