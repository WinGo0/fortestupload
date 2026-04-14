<template>
  <div class="contract-info-form">
    <h3 @click="openDwawer" class="form-title">新增合同信息</h3>

    <!-- 顶部表单 -->
    <a-form :model="formData" layout="vertical">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-form-item label="合同编码:" required>
            <a-input v-model:value="formData.contractCode" placeholder="请输入合同编码" />
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="金额:">
            <a-input v-model:value="formData.amount" placeholder="请输入" suffix="(万元)" />
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="签订日期:" required>
            <a-date-picker v-model:value="formData.signDate" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="结束日期:" required>
            <a-date-picker v-model:value="formData.endDate" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="合同名称:">
        <a-input
          v-model:value="formData.contractName"
          placeholder="请输入合同名称"
          :maxlength="100"
          show-count
        />
      </a-form-item>
    </a-form>

    <!-- 涵盖范围 -->
    <div class="coverage-section">
      <a-tag color="blue">涵盖范围</a-tag>
      <TableTransfer
        v-model="formData.selectedItems"
        @change="handleTransferChange"
      />
    </div>
    <ContractNodesDrawer v-model:open="drawerOpen" />
  </div>
</template>

<script setup>
import ContractNodesDrawer from './ContractNodesDrawer.vue'
import { reactive,ref } from 'vue'
import TableTransfer from './TableTransfer.vue'
const drawerOpen = ref(false)

const formData = reactive({
  contractCode: '4600001375-YWA125709-000',
  amount: '235.123456',
  signDate: null,
  endDate: null,
  contractName: '子订单:中国核电法系和中系压水堆机组2025年至2027年正常换料设计及相关技术服务合同',
  selectedItems: []
})

function handleTransferChange(items) {
  console.log('已选项变化:', items)
}
function openDwawer() {
  drawerOpen.value = true
}
</script>

<style scoped>
.contract-info-form {
  background: #fff;
  padding: 20px;
}

.form-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.coverage-section {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 16px;
}

.coverage-section > .ant-tag {
  margin-bottom: 12px;
}
</style>
