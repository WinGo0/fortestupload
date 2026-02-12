<template>
  <div class="alarm-setting-container">
    <!-- Search Input -->
    <div class="search-row">
      <el-input
        v-model="searchQuery"
        placeholder="选择参数，可快速输入检索"
        class="search-input"
      >
        <template #suffix>
          <el-icon class="el-input__icon"><Search /></el-icon>
        </template>
      </el-input>
      
      <!-- 忘记密码按钮 -->
      <el-button 
        type="text" 
        @click="openForgotPasswordDialog"
        class="forgot-password-btn"
      >
        忘记密码
      </el-button>
    </div>

    <el-form :model="formData" label-width="80px" label-position="left">
      <!-- Condition Row -->
      <el-form-item label="条件:">
        <el-select @keydown.enter.capture.prevent.stop="handleEnter" v-model="formData.condition" placeholder="请选择" style="width: 150px">
          <el-option label="大于等于" value="ge" />
          <el-option label="小于等于" value="le" />
          <el-option label="大于" value="gt" />
          <el-option label="小于" value="lt" />
        </el-select>
      </el-form-item>

      <!-- Delay Row -->
      <el-form-item label="延时报警:">
        <div class="delay-row">
          <PrecisionInputNumber
            v-model="formData.delayValue"
            :max="100"
            :controls="false"
            style="width: 150px"
          />
          <el-select v-model="formData.delayUnit" style="width: 80px; margin-left: 10px">
            <el-option label="分" value="min" />
            <el-option label="秒" value="sec" />
          </el-select>
        </div>
      </el-form-item>

      <!-- Checkbox Group -->
      <div class="checkbox-container">
        <el-checkbox-group v-model="formData.selectedAlarms">
          <div class="checkbox-grid">
            <el-checkbox 
              v-for="item in alarmOptions" 
              :key="item.key" 
              :label="item.key"
            >
              {{ item.value }}
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
  </el-form>

  <!-- 忘记密码弹框 -->
  <ForgotPasswordDialog ref="forgotPasswordDialogRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import PrecisionInputNumber from './PrecisionInputNumber.vue';
import ForgotPasswordDialog from './ForgotPasswordDialog.vue';

const searchQuery = ref('');
const formData = ref({
  condition: 'ge',
  delayValue: 20,
  delayUnit: 'min',
  selectedAlarms: []
});

const forgotPasswordDialogRef = ref();

const alarmOptions = ref([]);
const handleEnter = (event) => {
console.log('Enter key pressed', event);

  // 完全阻止事件
  event.stopPropagation()
  event.preventDefault()
}

const openForgotPasswordDialog = () => {
  if (forgotPasswordDialogRef.value) {
    forgotPasswordDialogRef.value.open();
  }
};

// Mock API Call
const fetchAlarmOptions = async () => {
  // Simulating the data from the image
  const responseData = [
    { key: 3, value: "稳态变化幅度" },
    // { key: 4, value: "稳态变化率" },
    // { key: 5, value: "稳态高报" },
    // { key: 6, value: "稳态低报" },
    // { key: 7, value: "稳态高高报" },
    // { key: 8, value: "稳态低低报" },
    // { key: 16, value: "稳态偏差值" },
    // { key: 50, value: "稳态时间段变化幅度" },
    // { key: 51, value: "稳态时间段变化率" },
    // { key: 70, value: "稳态偏差值高报" },
    // { key: 71, value: "稳态偏差值低报" },
    // { key: 72, value: "稳态变化幅度高报" },
    // { key: 73, value: "稳态变化幅度低报" },
    // { key: 74, value: "稳态变化率高报" },
    // { key: 75, value: "稳态变化率低报" },
    // { key: 75, value: "稳态时间段变化幅度高报" },
    // { key: 76, value: "稳态时间段变化幅度低报" },
    // { key: 77, value: "稳态时间段变化率高报" },
    // { key: 78, value: "稳态时间段变化率低报" }
  ];
  
  // Note: There's a duplicate key '75' in the provided image data, 
  // but I'll keep it as per the image or deduplicate if needed.
  // Actually, I'll filter unique keys for better Vue performance.
  const uniqueData = Array.from(new Map(responseData.map(item => [item.key, item])).values());
  alarmOptions.value = uniqueData;
};

onMounted(() => {
  fetchAlarmOptions();
});
</script>

<style scoped>
.alarm-setting-container {
  padding: 20px;
  background-color: #f5f7fa; /* Adjust based on theme */
  border-radius: 4px;
  max-width: 800px;
}

.search-row {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
}

.delay-row {
  display: flex;
  align-items: center;
}

.checkbox-container {
  margin-top: 20px;
  padding-left: 20px;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 20px;
}

/* Adjust checkbox label style to match image */
:deep(.el-checkbox) {
  margin-right: 0;
  display: flex;
  align-items: center;
}

:deep(.el-checkbox__label) {
  font-size: 13px;
  color: #606266;
}

/* 忘记密码按钮样式 */
.forgot-password-btn {
  margin-left: 15px;
  color: #409eff;
}

.forgot-password-btn:hover {
  color: #66b1ff;
}

/* Dark mode overrides if needed */
@media (prefers-color-scheme: dark) {
  .alarm-setting-container {
    background-color: #1d1e1f;
  }
  
  .forgot-password-btn {
    color: #409eff;
  }
  
  .forgot-password-btn:hover {
    color: #66b1ff;
  }
}
</style>
