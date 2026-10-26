<template>
  <el-row class="recipient-page">
    <el-col :span="6" class="group-panel">
      <div class="panel-head">
        <div>
          <h3>收件人分组</h3>
          <span>{{ groupCount }}个分组</span>
        </div>
        <el-button type="primary" size="small" @click="groupDialog = true">
          新建分组
        </el-button>
      </div>

      <div class="search-row">
        <el-input v-model="groupKeyword" placeholder="搜索分组" clearable />
        <el-button type="primary">搜索</el-button>
      </div>

      <div class="group-list">
        <button
          v-for="group in filteredGroups"
          :key="group.name"
          :class="{ active: activeGroup.name === group.name }"
          @click="activeGroup = group"
        >
          <span>{{ group.name }}</span>
          <span>{{ group.total }}</span>
        </button>
      </div>
    </el-col>

    <el-col :span="18" class="contact-panel">
      <div class="panel-head contact-head">
        <div>
          <h2>{{ activeGroup.name }}</h2>
          <span>{{ activeGroup.total }}</span>
        </div>
        <div class="contact-tools">
          <el-input
            v-model="contactKeyword"
            placeholder="搜索姓名、工号或邮箱地址"
            clearable
          />
          <el-button type="primary">搜索</el-button>
          <el-button type="primary">新建联系人</el-button>
        </div>
      </div>

      <el-table :data="filteredContacts" height="100%">
        <el-table-column prop="name" label="收件人姓名" min-width="100" />
        <el-table-column prop="employeeNo" label="收件人工号" min-width="120" />
        <el-table-column prop="email" label="收件人邮箱地址" min-width="180" />
        <el-table-column prop="group" label="所属分组" min-width="110" />
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button link type="primary">编辑</el-button>
            <el-button link type="primary">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-col>

    <el-dialog
      v-model="groupDialog"
      title="新建分组"
      width="420px"
      @closed="groupFormRef?.resetFields()"
    >
      <el-form ref="groupFormRef" :model="groupForm" :rules="rules">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialog = false">取消</el-button>
        <el-button type="primary" @click="createGroup">确定</el-button>
      </template>
    </el-dialog>
  </el-row>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const groups = reactive([
  { name: '全部联系人', total: 2846 },
  { name: '重要客户', total: 2846 },
  { name: '潜在客户', total: 128 },
])

const contacts = [
  { name: '张扬', employeeNo: '80333333', email: '19999999@qq.com', group: '重要客户' },
  { name: '张一', employeeNo: '80333333', email: '19999999@qq.com', group: '重要客户' },
  { name: '张二', employeeNo: '80333333', email: '19999999@qq.com', group: '重要客户' },
  { name: '张三', employeeNo: '80333333', email: '19999999@qq.com', group: '潜在客户' },
  { name: '张四', employeeNo: '80333333', email: '19999999@qq.com', group: '潜在客户' },
]

const activeGroup = ref(groups[0])
const groupKeyword = ref('')
const contactKeyword = ref('')
const groupCount = ref(5)
const groupDialog = ref(false)
const groupFormRef = ref()
const groupForm = reactive({ name: '' })
const rules = {
  name: [{ required: true, whitespace: true, message: '请输入分组名称', trigger: 'blur' }],
}

const filteredGroups = computed(() =>
  groups.filter((group) => group.name.includes(groupKeyword.value.trim())),
)

const filteredContacts = computed(() => {
  const keyword = contactKeyword.value.trim().toLowerCase()
  return contacts.filter(
    (contact) =>
      (activeGroup.value.name === '全部联系人' ||
        contact.group === activeGroup.value.name) &&
      [contact.name, contact.employeeNo, contact.email].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
  )
})

const createGroup = async () => {
  await groupFormRef.value.validate()
  const group = { name: groupForm.name.trim(), total: 0 }
  groups.push(group)
  groupCount.value++
  activeGroup.value = group
  groupDialog.value = false
}
</script>

<style scoped>
.recipient-page {
  --el-color-primary: #16b8d8;
  height: 100%;
  padding: 24px 24px 0;
  box-sizing: border-box;
  color: #303133;
  background: #fff;
}

.group-panel,
.contact-panel {
  height: 100%;
  min-width: 0;
}

.group-panel {
  padding-right: 24px;
}

.contact-panel {
  display: flex;
  flex-direction: column;
  padding-left: 24px;
  border-left: 1px solid #e6e8eb;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 58px;
}

.panel-head h2,
.panel-head h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-head span {
  font-size: 12px;
  color: #a8abb2;
}

.search-row,
.contact-tools {
  display: flex;
  gap: 8px;
}

.search-row {
  margin: 14px 0 22px;
}

.search-row :deep(.el-input),
.contact-tools :deep(.el-input) {
  flex: 1 1 0;
  min-width: 0;
}

.group-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 66px;
  padding: 0 16px;
  border: 0;
  border-radius: 2px;
  color: #16b8d8;
  font: inherit;
  font-size: 13px;
  background: transparent;
  cursor: pointer;
}

.group-list button span:last-child {
  color: #8d9199;
}

.group-list button.active {
  background: #eef8fb;
}

.contact-head h2 {
  font-size: 15px;
}

.contact-tools {
  width: min(610px, 66%);
}

.contact-panel :deep(.el-table) {
  flex: 1;
}

.contact-panel :deep(.el-table th.el-table__cell) {
  background: #f8f9fa;
  color: #303133;
  font-weight: 500;
}

.contact-panel :deep(.el-table .cell) {
  font-size: 13px;
}
</style>
