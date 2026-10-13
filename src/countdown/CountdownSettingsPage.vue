<template>
  <main class="page">
    <section class="panel">
      <header class="header">
        <div>
          <p class="eyebrow">SETTINGS</p>
          <h1>倒计时设置</h1>
        </div>
        <el-button @click="router.push('/')">返回</el-button>
      </header>

      <el-form :model="form" label-position="top">
        <el-form-item label="时长">
          <el-input-number
            v-model="form.muteTime"
            :min="1"
            :max="9999"
            :step="1"
            step-strictly
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="时间单位">
          <el-select v-model="form.muteTimeUnit">
            <el-option label="h" value="h" />
            <el-option label="m" value="m" />
            <el-option label="s" value="s" />
          </el-select>
        </el-form-item>

        <el-button type="primary" class="save-button" @click="save">
          保存
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAudiosStore, type MuteTimeUnit } from './audios'

const router = useRouter()
const store = useAudiosStore()

const form = reactive({
  muteTime: store.muteTime,
  muteTimeUnit: store.muteTimeUnit as MuteTimeUnit,
})

const save = () => {
  if (!store.saveSettings(form.muteTime, form.muteTimeUnit)) {
    ElMessage.warning('请输入大于 0 的整数')
    return
  }

  ElMessage.success('保存成功')
  router.push('/')
}
</script>

<style scoped>
.page {
  box-sizing: border-box;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f0f2f5;
}

.panel {
  box-sizing: border-box;
  width: min(480px, 100%);
  padding: 28px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #2563eb;
}

.header h1 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.panel :deep(.el-input-number),
.panel :deep(.el-select) {
  width: 100%;
}

.save-button {
  width: 100%;
}

@media (max-width: 560px) {
  .page {
    padding: 16px;
  }

  .panel {
    padding: 20px;
  }
}
</style>
