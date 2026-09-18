<template>
  <div class="drawer-page">
    <section class="drawer-panel">
      <header class="drawer-header">
        <span class="drawer-title">方案 BGK-FA-20260917000002</span>
        <el-button>取消</el-button>
      </header>

      <div class="drawer-content">
        <el-steps :active="stepActive" simple class="step-bar">
          <el-step title="方案基本信息" />
          <el-step title="前置条件配置" />
          <el-step title="监控项设置" />
          <el-step title="退出及操作" />
        </el-steps>

        <el-form
          ref="formRef"
          :model="formModel"
          :rules="formRules"
          label-width="150px"
          class="scheme-form"
        >
          <div v-show="stepActive === 0" class="step-panel">
            <el-form-item label="方案名称" prop="schemeName">
              <el-input v-model="formModel.schemeName" placeholder="请输入方案名称" />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <footer class="drawer-footer">
        <el-button :disabled="stepActive === 0" @click="handleStepJump(-1)">
          上一步
        </el-button>
        <el-button
          type="primary"
          :disabled="stepActive === stepFields.length - 1"
          @click="handleStepJump(1)"
        >
          下一步
        </el-button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const stepActive = ref(0)
const formRef = ref()

const formModel = reactive({
  schemeName: 'test6'
})

const formRules = {
  schemeName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }]
}

const stepFields = [
  ['schemeName'],
  [],
  [],
  []
]

const stepValidFields = {
  0: ['schemeName'],
  1: [],
  2: [],
  3: []
}

const handleStepJump = async (pace) => {
  const fields = stepFields[stepActive.value]
  console.log('fields', fields)
  console.log('formModel', formModel)

  try {
    if (pace > 0 && stepValidFields[stepActive.value].length) {
      await formRef.value.validateField(stepValidFields[stepActive.value])
    }

    stepActive.value += pace
  } catch (error) {
    console.log('校验失败', error)
  }
}
</script>

<style scoped>
.drawer-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24px;
  background: #f0f2f5;
}

.drawer-panel {
  display: flex;
  min-height: calc(100vh - 48px);
  flex-direction: column;
  background: #fff;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
}

.drawer-title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.drawer-content {
  flex: 1;
  padding: 28px 24px;
}

.step-bar {
  margin-bottom: 36px;
}

.scheme-form {
  max-width: 760px;
  margin: 0 auto;
}

.step-panel {
  min-height: 160px;
}

.drawer-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px;
}
</style>
