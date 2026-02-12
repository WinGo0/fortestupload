<template>
  <div class="import-section">
    <!-- 1. 步骤条 -->
    <el-steps :active="1" align-center finish-status="success" class="mb-4">
      <el-step title="上传文件" description="根据模板修改后上传" />
      <el-step title="执行导入" description="数据导入至服务器" />
      <el-step title="导入成功" description="完成数据批量导入" />
    </el-steps>

    <!-- 2. 下载与上传区域 -->
    <div class="content-wrapper">
      <!-- 下载模板 -->
      <div class="task-row">
        <div class="action-card download-card">
          <el-icon class="card-icon"><Document /></el-icon>
          <span class="card-text">下载模板</span>
        </div>
        <div class="info-wrapper">
          <h4 class="info-title">填写模板信息</h4>
          <p class="info-desc">
            请按照设定的参数填写好在相关条件下的比对参考值。如果更新了参数，需要以新的模板进行数据更新导入；
          </p>
        </div>
      </div>

      <!-- 上传文件 -->
      <div class="task-row">
        <el-upload
          class="action-card upload-card"
          drag
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
          :show-file-list="false"
        >
          <el-icon class="card-icon"><UploadFilled /></el-icon>
          <div class="card-text">上传文件</div>
        </el-upload>
        <div class="info-wrapper">
          <h4 class="info-title">上传填好的监控参数的参考值信息</h4>
          <p class="info-desc">
            文件后缀名必须为csv、xls或xlsx（即Excel格式），<br>
            文件大小不得大于10M。
          </p>
        </div>
      </div>

      <div class="footer-tip">相当于批量设定，在有较多参数时使用；</div>
    </div>
  </div>
</template>

<script setup>
import { Document, UploadFilled } from '@element-plus/icons-vue';
</script>

<style scoped>
.import-section {
  padding: 10px;
  background-color: #fff;
}

.mb-4 {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.content-wrapper {
  padding: 0 20px;
}

.task-row {
  display: flex;
  margin-bottom: 30px;
  align-items: flex-start;
}

/* 统一卡片样式 (下载框 & 上传框) */
.action-card {
  width: 110px;
  height: 110px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-right: 25px;
  cursor: pointer;
  background-color: #fafafa;
  transition: all 0.3s;
  flex-shrink: 0;
  box-sizing: border-box;
}

.action-card:hover {
  border-color: #409eff;
  color: #409eff;
}

/* 这里特别覆盖 el-upload 默认的 drag 样式使其适应小方块 */
.upload-card :deep(.el-upload),
.upload-card :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.card-icon {
  font-size: 36px;
  margin-bottom: 10px;
  color: #909399;
}

.action-card:hover .card-icon {
  color: #409eff;
}

.card-text {
  font-size: 14px;
  color: #409eff;
}

.info-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #303133;
}

.info-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.footer-tip {
  margin-top: -15px;
  padding-left: 135px; /* Box width + margins */
  font-size: 13px;
  color: #e6a23c;
}
</style>
