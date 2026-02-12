<template>
  <el-dialog
    v-model="visible"
    title="忘记密码"
    width="400px"    
    :close-on-click-modal="false"
    align-center
    >
    <!-- :before-close="handleClose" -->
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="80px"
      label-position="left"
    >
      <el-form-item label="年纪" prop="username">
        <el-input
          v-model="form.username"
          placeholder=""
          clearable
        />
      </el-form-item>

      <el-form-item label="姓名" prop="email">
        <el-input
          v-model="form.email"
          placeholder=""
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          提交
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const loading = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  email: ''
})

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const emit = defineEmits(['submit'])

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (valid) {
      loading.value = true
      
      // 这里可以调用API发送重置密码请求
      console.log('提交重置密码请求:', form)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      ElMessage.success('重置密码链接已发送到您的邮箱，请查收')
      handleClose()
      emit('submit', form)
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 暴露打开方法
const open = () => {
  visible.value = true
}

defineExpose({
  open
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

</style>