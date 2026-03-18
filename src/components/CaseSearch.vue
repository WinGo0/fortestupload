<template>
  <div class="wrap">
    <!-- 头部的搜索区和推荐栏，常驻显示 -->
    <div class="header">
      <h2>中核运行病例库</h2>
      <el-input
        v-model="keyword"
        placeholder="输入病例编号、系统名称、运行病例名称查询"
        class="input-box"
        @keyup.enter="handleSearch"
        clearable
      >
        <template #suffix>
          <el-icon style="cursor: pointer" @click="handleSearch">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704z"></path>
            </svg>
          </el-icon>
        </template>
      </el-input>

      <!-- 推荐栏独立出来，不再因为 searchState 隐藏 -->
      <div class="rec-list">
        <span @click="quickSearch('安全壳环廊房间通风系统（DVW）')">1、安全壳环廊房间通风系统（DVW）</span>
        <span @click="quickSearch('废气处理系统（TEG）')">2、废气处理系统（TEG）</span>
        <span @click="quickSearch('热门病例名称（系统编号）')">3、热门病例名称（系统编号）</span>
      </div>
    </div>

    <!-- 动态结果区 -->
    <div class="main">
      <template v-if="searched">
        <!-- 无数据状态使用内置的 el-empty，不需要外部资源 -->
        <el-empty v-if="list.length === 0" description="没查询到相关数据" :image-size="80">
          <div class="empty-tip">切换关键词或去添加病例！</div>
          <el-button type="primary" size="small" class="add-btn">+ 添加病例</el-button>
        </el-empty>

        <!-- 有数据状态 -->
        <div v-else class="list-wrap">
          <div v-for="(item, i) in list" :key="i" class="card">
            <div class="card-hd">
              <div class="hd-left">
                <span class="title">{{ item.title }}</span>
                <span class="time">发生时间：{{ item.time }}</span>
              </div>
              <el-link type="primary" :underline="false">查看详情</el-link>
            </div>

            <!-- 数据栅格 -->
            <el-row class="grid-info">
              <el-col :span="8">
                <div><span>所属电厂：</span>{{ item.plant }}</div>
                <div><span>涉及系统：</span>{{ item.sys }}</div>
              </el-col>
              <el-col :span="8">
                <div><span>机组：</span>{{ item.unit }}</div>
                <div><span>系统/设备别名：</span>{{ item.alias }}</div>
              </el-col>
              <el-col :span="8">
                <div><span>机组状态模式：</span>{{ item.mode }}</div>
                <div><span>设备KKS码：</span>{{ item.kks }}</div>
              </el-col>
            </el-row>

            <!-- 详细说明 -->
            <div class="txt-info">
              <div class="flex-row">
                <span class="label">缺陷/异常现象：</span>
                <span class="content">{{ item.abnormal }}</span>
              </div>
              <div class="flex-row">
                <span class="label">风险/后果：</span>
                <span class="content">{{ item.risk }}</span>
              </div>
              <div class="flex-row">
                <span class="label">运行采取行动：</span>
                <div class="content">
                  <div v-for="(act, idx) in item.actions" :key="idx">{{ act }}</div>
                </div>
              </div>
            </div>
          </div>

          <el-pagination 
            background 
            layout="prev, pager, next, jumper, sizes, total" 
            :total="50" 
            class="pager"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const keyword = ref('');
const searched = ref(false);
const list = ref([]);

const mockData = [
  {
    title: '5M1DVW016KA:001PI进风湿度高报警',
    time: '2026年1月10日 20:14',
    plant: '方家山电厂',
    sys: 'DVW',
    unit: '二号机组',
    alias: 'QF_01_2DVW',
    mode: 'RP模式，电功率1118MW',
    kks: '',
    abnormal: '5M1DVW016KA:001PI进风湿度高报警、',
    risk: '001PI进风湿度高导致碘过滤器失效；',
    actions: [
      '1、查阅技术规范以及解释规范；',
      '2、停运5M1DVW003ZV后进入NA53B以及NA533测量就地房间湿度为20%左右；',
      '3、咨询参考电厂湿度大于50%记录I01（DVW2），3天内机组开始向MCS模式后撤，报警定值42%；',
      '4、与安工进行沟通，因就地测量湿度不高，碘过滤器可用，不需要记录I0；',
      '暂无'
    ]
  },
  {
    title: '【病例名称最长50个字符】...',
    time: '2026年1月10日 20:14',
    plant: '秦山一厂',
    sys: 'DVW',
    unit: '二号机组',
    alias: 'Q1_02_2DVW',
    mode: 'RP模式，电功率1118MW',
    kks: '',
    abnormal: '主控室操纵员发现2号主泵泄漏油泵6M2RCP023PO根部下部油箱液位大于26%自动启动后，泄漏油泵出口油流量正常，但是下部油箱液位维持在21%左右不降，无法达到停泵液位定值19%，泄漏油泵保持运行无法自动停运，在手动停运6M2RCP023PO后，2号主泵下部油箱液位会缓慢上涨。',
    risk: '1、把2号主泵下部油箱排光，液位达到2%会跳停2号主泵；\n2、可能损坏泄漏油泵6M2RCP023PO。',
    actions: ['1、查阅技术规范以及解释规范；']
  }
];

const handleSearch = () => {
  if (!keyword.value.trim()) {
    searched.value = false;
    list.value = [];
    return;
  }
  
  const key = keyword.value.trim().toUpperCase();
  searched.value = true;
  if (key.includes('DVW') || key.includes('TEG') || key.includes('系统') || key.includes('病例')) {
    list.value = mockData;
  } else {
    list.value = [];
  }
};

const quickSearch = (val) => {
  keyword.value = val;
  handleSearch();
};
</script>

<style scoped>
.wrap {
  background: #f0f2f5;
  min-height: 100%;
  padding: 0 40px 20px;
  color: #333;
  border-radius: 8px;
  font-family: sans-serif;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0 24px;
  background: #f0f2f5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h2 {
  font-size: 20px;
  margin: 0 0 20px;
}

.input-box {
  width: 60%;
  min-width: 600px;
  max-width: 800px;
}

/* 独立常驻的推荐层 */
.rec-list {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
  width: 60%;
  min-width: 600px;
  max-width: 800px;
}
.rec-list span {
  cursor: pointer;
}
.rec-list span:hover {
  color: #409eff;
}

/* 空数据状态微调 */
.empty-tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 20px;
}
.add-btn {
  border-radius: 4px;
}

/* 卡片列表区 */
.list-wrap {
  padding: 10px 0;
}
.card {
  background: #fff;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
}
.card-hd {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.hd-left .title {
  font-size: 16px;
  font-weight: bold;
  margin-right: 20px;
}
.hd-left .time {
  font-size: 13px;
  color: #909399;
}

.grid-info {
  font-size: 13px;
  line-height: 24px;
  margin-bottom: 12px;
}
.grid-info span {
  color: #909399; /* 专门为小标签指定浅色 */
}

/* 底部详情说明块 */
.txt-info {
  font-size: 13px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.flex-row {
  display: flex;
}
.flex-row .label {
  color: #303133;
  font-weight: 500;
  width: 110px;
  flex-shrink: 0;
}
.flex-row .content {
  color: #606266;
  flex: 1;
}

.pager {
  justify-content: center;
  margin: 20px 0;
}
</style>
