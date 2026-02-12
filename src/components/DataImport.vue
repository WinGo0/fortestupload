<template>
  <div class="data-import-container">
    <h3>Data Import Section</h3>
    
    <!-- Mimic the switch logic with a radio group for demo -->
    <div style="margin-bottom: 20px;">
        <label>Form Data Type: </label>
        <select v-model="formData.type">
            <option value="0">Import Section (Default)</option>
            <option value="1">Threshold Rules (Type 1)</option>
        </select>
    </div>

    <!-- Image 1 & 0 content: v-else class="import-section" -->
    <div v-if="formData.type !== '1'">
      <DataUpload />
    </div>

    <!-- Image 0 content: v-else-if="formData.type === '1'" -->
    <div v-else-if="formData.type === '1'">
        <el-form :model="formData" label-width="120px">
             <!-- 普通阈值 -->
            <el-form-item label="监控规则" required>
                <el-text type="warning">关联参数的当前值进行普通阈值监控报警</el-text>
             </el-form-item>
             <el-row :gutter="20" style="width: 100%">
                 <el-col :span="12">
                     <el-form-item label="Placeholder">
                         <!-- Potential usage of range inputs classes in future -->
                         <div class="range-inputs-start">
                             <el-input placeholder="Start"></el-input>
                         </div>
                         <div class="range-inputs-end">
                             <el-input placeholder="End"></el-input>
                         </div>
                     </el-form-item>
                 </el-col>
             </el-row>
        </el-form>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import DataUpload from './DataUpload.vue';

const formData = ref({
  type: '0', 
});
</script>

<style scoped>
.data-import-container {
    padding: 20px;
    background: #fff;
    color: #333;
    border-radius: 8px;
    margin-top: 20px;
}

/* Styles from screenshot that seem to belong to the form part (Type 1) */
.range-inputs-start {
  display: inline-flex;
  width: 45%;
}

.range-inputs-end {
  display: inline-flex;
  width: 45%;
}
</style>
