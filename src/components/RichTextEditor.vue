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
            <el-button type="success" @click="triggerFileInput">
              <el-icon style="margin-right:4px"><Upload /></el-icon>
              上传表格（行列转置）
            </el-button>
            <el-button @click="handlePreview">预览内容</el-button>
            <el-button @click="handleReset">重置表单</el-button>
            <el-button @click="handleLoadData">加载示例数据</el-button>
          </el-space>

          <!-- 隐藏的文件输入 -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls,.csv"
            style="display:none"
            @change="handleFileChange"
          />
          <span v-if="uploading" style="margin-left:8px;color:#409eff;">
            正在解析表格...
          </span>
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
import * as XLSX from 'xlsx'
import { Upload } from '@element-plus/icons-vue'
import request from '../utils/request'
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

// 文件输入引用
const fileInputRef = ref(null)

// 上传状态
const uploading = ref(false)

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

// ---------- 表格上传相关 ----------

// 触发文件选择
function triggerFileInput() {
  if (!editorRef.value) {
    ElMessage.warning('请等待编辑器加载完成')
    return
  }
  fileInputRef.value?.click()
}

// 处理文件选择
async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()

  try {
    uploading.value = true
    let rows = []

    if (ext === 'csv') {
      rows = await parseCSV(file)
    } else if (ext === 'xlsx' || ext === 'xls') {
      rows = await parseExcel(file)
    } else {
      ElMessage.error('仅支持 .xlsx、.xls、.csv 格式文件')
      return
    }

    if (!rows || rows.length === 0) {
      ElMessage.warning('表格数据为空')
      return
    }

    // 转置：行变列，列变行
    const transposed = transpose(rows)

    // 构建 HTML 表格并插入编辑器
    const html = buildTableHTML(transposed)
    editorRef.value.dangerouslyInsertHtml(html)
    ElMessage.success(`表格已插入（${transposed.length} 行 × ${transposed[0]?.length || 0} 列，已转置）`)
  } catch (err) {
    console.error('表格解析失败:', err)
    ElMessage.error('表格解析失败: ' + (err.message || '未知错误'))
  } finally {
    uploading.value = false
    // 重置 file input，允许再次选择同一文件
    event.target.value = ''
  }
}

// 解析 CSV 文件
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
        const result = lines.map(line => {
          // 处理 CSV 中的引号包裹字段
          const cells = []
          let current = ''
          let inQuotes = false
          for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (ch === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
              } else {
                inQuotes = !inQuotes
              }
            } else if (ch === ',' && !inQuotes) {
              cells.push(current.trim())
              current = ''
            } else {
              current += ch
            }
          }
          cells.push(current.trim())
          return cells
        })
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 解析 Excel 文件（使用 xlsx / SheetJS）
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          reject(new Error('未找到工作表'))
          return
        }

        const sheet = workbook.Sheets[firstSheetName]
        // header: 1 返回二维数组，defval 填充空单元格
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        // 过滤掉全空行
        const filtered = rows.filter(row => row.some(cell => String(cell ?? '').trim() !== ''))
        resolve(filtered)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

// 转置二维数组（行变列，列变行）
function transpose(rows) {
  if (!rows || rows.length === 0) return []
  const colCount = Math.max(...rows.map(r => r.length))
  const result = Array.from({ length: colCount }, () =>
    Array.from({ length: rows.length }, () => '')
  )
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < (rows[i]?.length || 0); j++) {
      result[j][i] = rows[i][j] || ''
    }
  }
  return result
}

// 构建 wangEditor 可识别的 HTML 表格
function buildTableHTML(rows) {
  if (!rows || rows.length === 0) return ''
  let html = '<table><tbody>'
  for (let i = 0; i < rows.length; i++) {
    html += '<tr>'
    // 第一行（原第一列）默认作为表头
    const isHeader = (i === 0)
    for (const cell of rows[i]) {
      const tag = isHeader ? 'th' : 'td'
      const content = escapeHtml(String(cell ?? ''))
      html += `<${tag}>${content}</${tag}>`
    }
    html += '</tr>'
  }
  html += '</tbody></table>'
  return html
}

// HTML 转义（防 XSS）
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ---------- 编辑器配置 ----------

// 工具栏配置
const toolbarConfig = {
  excludeKeys: [
    'insertLink',  // 排除“插入链接”按钮
    'insertImage', // 排除包含网络图片的原始“图片”菜单
    'group-video', // 排除视频组
  ],
  insertKeys: {
    index: 22, // 在原位置插入
    keys: [
      // 使用对象配置，showText: true 是编辑器官方支持的配置，用于强制显示文字
      { key: 'uploadImage', showText: true } 
    ]
  }
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
    // 上传图片配置
    uploadImage: {
      // 自定义上传：将图片转为 Base64 插入，不再调用后端上传接口
      async customUpload(file, insertFn) {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const base64 = reader.result
          // 直接插入 Base64 字符串
          // 参数：url (这里是 base64), alt, href
          insertFn(base64, file.name, base64)
          ElMessage.success('图片已转为 Base64 插入')
        }
        reader.onerror = (error) => {
          console.error('图片转 Base64 失败:', error)
          ElMessage.error('图片处理失败')
        }
      },
      // 允许上传的图片类型
      allowedFileTypes: ['image/*'],
      // 单个文件的最大体积限制，注意 Base64 会变大，建议不要设置过大以免页面卡顿
      maxFileSize: 2 * 1024 * 1024,
    },
    // 如果需要上传视频，建议还是走后端，Base64 视频体积太大
    // uploadVideo: { ... }
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
