<template>
  <div style="padding: 20px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
    <!-- 1. 表单部分：展示已有图片或上传新图片 -->
    <el-form :model="form" label-width="80px">
      <el-form-item label="项目名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="封面图">
        <el-upload
          class="box"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleChange"
        >
          <img v-if="form.url" :src="form.url" class="img" />
          <el-icon v-else class="icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交给后端 (Base64)</el-button>
        <el-button @click="form = { name: '回显项目', url: 'https://picsum.photos/100' }">模拟数据填充</el-button>
      </el-form-item>
    </el-form>

    <!-- 2. 列表部分：展示图片并支持编辑回填 -->
    <el-table :data="list" border style="margin-top: 20px">
      <el-table-column prop="name" label="名称" />
      <el-table-column label="图片">
        <template #default="{ row }">
          <el-image :src="row.url" style="width: 40px; height: 40px" />
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button link type="primary" @click="form = { ...row }">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const form = ref({ name: '', url: '' })
const list = ref([
  { name: '项目 A', url: 'https://picsum.photos/100/100?1' },
  { name: '项目 B', url: 'https://picsum.photos/100/100?2' }
])

const handleChange = (file) => {
  // 1. 预览图片（本地临时 URL）
  form.value.url = URL.createObjectURL(file.raw)

  // 2. 转 Base64（实际传给后端的格式）
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    form.value.imageBase64 = reader.result // 成功的 Base64 字符串
  }
}

const handleSubmit = () => {
  console.log('提交的数据：', {
    name: form.value.name,
    image: form.value.imageBase64 // 这里传给后端
  })
  alert('已将 Base64 发送到控制台，请查看！')
}
</script>

<style scoped>
.box {
  border: 1px dashed #ccc;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.img { width: 100%; height: 100%; object-fit: cover; }
.icon { font-size: 28px; color: #999; }
</style>
