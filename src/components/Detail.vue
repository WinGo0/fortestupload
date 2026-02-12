<template>
  <div class="detail-container">
    <!-- 标题和基本信息 -->
    <h2 class="case-title">{{ caseData.title || '病例详情' }}</h2>

    <!-- 用表格或 description 列表展示结构化字段 -->
    <div class="info-grid">
      <div class="info-item">
        <span class="label">病例编号</span>
        <span class="value">{{ caseData.jnpc || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="label">电站</span>
        <span class="value">{{ caseData.station || '田湾核电站' }}</span>
      </div>
      <div class="info-item">
        <span class="label">发生日期</span>
        <span class="value">{{ caseData.date || '2025-08-21' }}</span>
      </div>
      <div class="info-item">
        <span class="label">缺陷名称</span>
        <span class="value">{{ caseData.defectName }}</span>
      </div>
      <!-- 更多字段... -->
    </div>

    <!-- 富文本描述部分 -->
    <div class="content-title">事件描述：</div>
    <div
      class="wang-html-content"
      v-html="caseData.descriptionHtml"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 假设这是接口返回的数据（已处理成 html）
const caseData = ref({
  jnpc: 'TW_01_202618150018',
  station: '田湾核电站',
  date: '2025-08-21',
  defectName: '5M1CFI3135N仪表故障导致5M1CFI031TF轴承触发油位低报警',
  descriptionHtml: `
    <p>2023年8月18日10:49，主控巡盘发现031TF鼓后轴承油箱313BA油位低报警，通知现场检查后，反馈轴承油位正常，联系维修和仪控人员，确认为仪表触发。</p>
    <p>2025年8月21日04:15，主控室1CFI322KA（032TF鼓网左轴承322BA液位低），就地运行和维修人员检查确认1CFI032TF鼓左轴承油箱322BA液位实际偏低，怀疑5M1CFI3225N仪表故障。</p>
    <img src="https://your-domain.com/images/system-diagram.png" alt="系统逻辑图" style="max-width:100%;margin:16px 0;" />
    <img src="https://your-domain.com/images现场照片.jpg" alt="现场检查照片" style="max-width:100%;margin:16px 0;" />
  `
})
</script>

<style scoped>
.detail-container {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
  font-family: "Microsoft YaHei", sans-serif;
}

.case-title {
  color: #2c3e50;
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px 32px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  gap: 12px;
}

.label {
  font-weight: bold;
  color: #555;
  min-width: 100px;
}

.value {
  color: #333;
}

.content-title {
  font-size: 1.1em;
  font-weight: bold;
  margin: 32px 0 16px;
  color: #34495e;
}

/* 非常关键 —— wangEditor 内容样式重置 */
.wang-html-content {
  line-height: 1.8;
  font-size: 15px;
  color: #333;
}

.wang-html-content :deep(p) {
  margin: 0 0 16px;
}

.wang-html-content :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 16px auto;
  border: 1px solid #eee;
  border-radius: 4px;
}

.wang-html-content :deep(table),
.wang-html-content :deep(td),
.wang-html-content :deep(th) {
  border: 1px solid #ddd;
  border-collapse: collapse;
  padding: 8px;
}

.wang-html-content :deep(strong) {
  color: #c0392b;
}
</style>