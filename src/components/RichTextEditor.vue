
<template>
  <div class="rich-text-editor">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>富文本编辑器 - 后端联调示例</span>
        </div>
      </template>

      <!-- 表单区域 -->
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <!-- wangEditor编辑器 -->
          <div style="border: 1px solid #ccc">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
            <Editor
              style="height: 500px; overflow-y: hidden"
              v-model="formData.content"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="formData.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入摘要（可选）"
          />
        </el-form-item>

        <el-form-item>
          <el-space>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">
              提交保存
            </el-button>
            <el-button @click="handlePreview">预览内容</el-button>
            <el-button @click="handleReset">重置表单</el-button>
            <el-button @click="handleLoadData">加载示例数据</el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <!-- 提交参数展示 -->
      <el-card v-if="showParams" style="margin-top: 20px">
        <template #header>
          <span>提交给后端的参数格式</span>
        </template>
        <div style="max-height: 300px; overflow-y: auto">
          <pre>{{ JSON.stringify(submitParams, null, 2) }}</pre>
        </div>
      </el-card>

      <!-- 预览内容 -->
      <el-card v-if="showPreview" style="margin-top: 20px">
        <template #header>
          <span>预览效果</span>
        </template>
        <div class="preview-content">
          <h2>{{ formData.title }}</h2>
          <div v-html="formData.content"></div>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import {
  ElCard,
  ElButton,
  ElSpace,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage
} from 'element-plus'

// 表单引用
const formRef = ref(null)

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 表单数据
const formData = ref({
  title: '',
  content: '', // 富文本内容，存储HTML字符串
  summary: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 去除HTML标签后检查是否有实际内容
        const text = value.replace(/<[^>]+>/g, '').trim()
        if (!text) {
          callback(new Error('内容不能为空'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 编辑器模式
const mode = 'default'

// 提交状态
const submitting = ref(false)

// 是否显示参数
const showParams = ref(false)

// 是否显示预览
const showPreview = ref(false)

// 提交参数（用于展示）
const submitParams = ref({})

// 工具栏配置
const toolbarConfig = {
  excludeKeys: [
    'group-image', // 排除图片组（包含上传图片、网络图片等）
    'insertImage', 
    'uploadImage',
    // 排除视频
    'group-video',
    'insertVideo',
    'uploadVideo'
  ]
}

// 切换全屏（触发内置的全屏按钮）
const toggleFullScreen = () => {
  // 通过DOM查找并点击工具栏中的全屏按钮
  // wangEditor v5 的全屏按钮通常有特定的 data-menu-key
  const fullScreenBtn = document.querySelector('.w-e-toolbar-item [data-menu-key="fullScreen"]')
  if (fullScreenBtn) {
    // 找到父级可点击元素
    const clickTarget = fullScreenBtn.closest('.w-e-bar-item') || fullScreenBtn
    clickTarget.click()
  } else {
    // 备用方案：尝试通过 text content 查找（如果 key 变了）
    const allBtns = document.querySelectorAll('.w-e-menu-tooltip-container')
    for (const btn of allBtns) {
      if (btn.textContent.includes('全屏')) {
        btn.click()
        return
      }
    }
    ElMessage.warning('未找到全屏功能，请确保编辑器已完全加载')
  }
}

// 编辑器配置
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    // 上传图片配置 - 实际开发中需要配置真实的上传接口
    // uploadImage: {
    //   // 上传接口地址（根据实际后端接口修改）
    //   server: '/api/upload/image',
    //   // 上传文件的字段名
    //   fieldName: 'file',
    //   // 允许上传的图片类型
    //   allowedFileTypes: ['image/*'],
    //   // 单个文件的最大体积限制，默认为 2M
    //   maxFileSize: 2 * 1024 * 1024,
    //   // 最多可上传几个文件，默认为 100
    //   maxNumberOfFiles: 10,
    //   // 自定义上传参数，例如传递token等
    //   meta: {
    //     token: 'xxx', // 实际开发中从store或localStorage获取
    //     otherKey: 'otherValue'
    //   },
    //   // 自定义 header，例如传递token
    //   headers: {
    //     Accept: 'text/x-json',
    //     otherKey: 'otherValue'
    //   },
    //   // 上传成功后的回调
    //   onSuccess(file, res) {
    //     console.log('图片上传成功', file, res)
    //     // 实际开发中，后端返回格式可能是：
    //     // { code: 200, data: { url: 'https://xxx.com/image.jpg' }, message: 'success' }
    //     // 需要根据实际后端返回格式处理
    //   },
    //   // 上传失败后的回调
    //   onFailed(file, res) {
    //     console.error('图片上传失败', file, res)
    //     ElMessage.error('图片上传失败，请重试')
    //   },
    //   // 上传错误后的回调
    //   onError(file, err, res) {
    //     console.error('图片上传错误', file, err, res)
    //     ElMessage.error('图片上传出错：' + err.message)
    //   },
    //   // 自定义插入图片的格式（根据后端返回格式调整）
    //   customInsert(res, insertFn) {
    //     // res 即服务端的返回结果
    //     // 从 res 中找到 url alt href ，然后插入图片
    //     // 实际开发中，根据后端返回的数据结构来解析
    //     // 例如：res.data.url 或 res.url
    //     const url = res.data?.url || res.url
    //     const alt = res.data?.alt || res.alt || ''
    //     const href = res.data?.href || res.href || ''
    //     insertFn(url, alt, href)
    //   }
    // }
  }
}

// 编辑器创建完成后的回调
const handleCreated = (editor) => {
  editorRef.value = editor
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 表单验证
    await formRef.value.validate()

    // 获取编辑器内容（双重保障，虽然v-model已经绑定了）
    if (editorRef.value) {
      formData.value.content = editorRef.value.getHtml()
    }

    // 构建提交参数
    submitParams.value = {
      title: formData.value.title,
      content: formData.value.content, // HTML字符串
      summary: formData.value.summary || null,
      // 实际开发中可能还需要其他字段
      // authorId: store.state.user.id,
      // categoryId: categoryId.value,
      // tags: tags.value,
      // publishTime: publishTime.value
    }

    // 显示提交参数（用于调试）
    showParams.value = true
    console.log('提交参数：', submitParams.value)

    // 实际开发中的API调用示例
    submitting.value = true
    try {
      // 方式1：使用axios发送POST请求
      // const response = await axios.post('/api/article/save', submitParams.value)
      
      // 方式2：使用fetch
      // const response = await fetch('/api/article/save', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': 'Bearer ' + token
      //   },
      //   body: JSON.stringify(submitParams.value)
      // })
      // const result = await response.json()

      // 模拟API调用（实际开发中删除这部分）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      ElMessage.success('提交成功！')
      console.log('提交成功，参数格式：', JSON.stringify(submitParams.value, null, 2))
      
      // 实际开发中，提交成功后可能需要跳转或刷新
      // router.push('/article/list')
    } catch (error) {
      console.error('提交失败：', error)
      ElMessage.error('提交失败：' + (error.message || '未知错误'))
    } finally {
      submitting.value = false
    }
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 预览内容
const handlePreview = () => {
  if (editorRef.value) {
    formData.value.content = editorRef.value.getHtml()
  }
  showPreview.value = true
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
  if (editorRef.value) {
    editorRef.value.clear()
  }
  showParams.value = false
  showPreview.value = false
}

// 加载示例数据（用于测试）
const handleLoadData = () => {
  formData.value = {
    title: '示例文章标题',
    content: '<p>这是一段<strong>示例内容</strong>，用于测试富文本编辑器。</p><p>支持<em>多种格式</em>，包括：</p><ul><li>列表项1</li><li>列表项2</li></ul>',
    summary: '这是文章的摘要信息'
  }
  if (editorRef.value) {
    editorRef.value.setHtml(formData.value.content)
  }
  ElMessage.info('已加载示例数据')
}

// 组件销毁时，及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 12px;
  color: #666;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
}

.preview-content {
  padding: 20px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.preview-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}
</style>