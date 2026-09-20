<template>
  <BaseDrawer>
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">方案 BGK-FA-20260917000002</span>
        <div class="drawer-actions">
          <el-radio-group v-model="mode" size="small">
            <el-radio-button value="simple">简易模式</el-radio-button>
            <el-radio-button value="advanced">高级模式</el-radio-button>
          </el-radio-group>
          <el-button>取消</el-button>
          <el-button
            v-if="currentStepIndex === activeSteps.length - 1"
            type="primary"
            @click="handleSubmit"
          >
            保存
          </el-button>
        </div>
      </div>
    </template>

    <div class="drawer-content" width="300">
      <el-steps :active="stepActive" simple style="margin-bottom: 15px">
        <el-step title="方案基本信息" />
        <el-step v-if="isAdvancedMode" title="前置条件配置" />
        <el-step title="监控项设置" />
        <el-step v-if="isAdvancedMode" title="退出及操作" />
      </el-steps>

      <el-form
        :model="formModel"
        label-width="150"
        ref="formRef"
        :rules="formRules"
      >
        <div v-show="stepActive === 0">
          <el-form-item label="方案名称" prop="schemeName">
            <el-input v-model="formModel.schemeName" placeholder="请输入方案名称" />
          </el-form-item>
        </div>

        <div v-if="isAdvancedMode" v-show="stepActive === 1"></div>
        <div v-show="stepActive === 2"></div>
        <div v-if="isAdvancedMode" v-show="stepActive === 3"></div>
      </el-form>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button :disabled="currentStepIndex === 0" @click="handleStepJump(-1)">
          上一步
        </el-button>
        <el-button
          type="primary"
          :disabled="currentStepIndex === activeSteps.length - 1"
          @click="handleStepJump(1)"
        >
          下一步
        </el-button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseDrawer from './BaseDrawer.vue'

const mode = ref('advanced')
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

const isAdvancedMode = computed(() => mode.value === 'advanced')
const activeSteps = computed(() => isAdvancedMode.value ? [0, 1, 2, 3] : [0, 2])
const currentStepIndex = computed(() => activeSteps.value.indexOf(stepActive.value))

watch(mode, () => {
  if (!activeSteps.value.includes(stepActive.value)) {
    stepActive.value = 0
  }
})

const handleStepJump = async (pace) => {
  const fields = stepFields[stepActive.value]
  console.log('fields', fields)
  console.log('formModel', formModel)

  try {
    if (pace > 0 && stepValidFields[stepActive.value].length) {
      await formRef.value.validateField(stepValidFields[stepActive.value])
    }

    stepActive.value = activeSteps.value[currentStepIndex.value + pace]
  } catch (error) {
    console.log('校验失败', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    console.log('保存表单', formModel)
  } catch (error) {
    console.log('校验失败', error)
  }
}
</script>

<style scoped>
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

.drawer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-content {
  box-sizing: border-box;
  width: 100%;
  min-height: 300px;
  padding: 24px;
}

.drawer-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px;
}
</style>
