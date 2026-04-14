<template>
  <Drawer
    v-model:open="drawerOpen"
    title="查看合同节点"
    width="520"
    :closable="true"
    :mask-closable="true"
    @close="emit('update:open', false)"
  >
    <!-- 搜索框（和截图完全一致） -->
    <template #extra>
      <a-input-search
        placeholder="输入搜索关键词"
        style="width: 200px"
        allow-clear
      />
    </template>

    <div class="node-timeline">
      <Timeline>
        <TimelineItem
          v-for="(node, index) in displayNodes"
          :key="index"
          :color="node.color"
        >
          <!-- 自定义圆点（完全复刻截图） -->
          <template #dot>
            <div
              class="custom-dot"
              :class="{ current: index === displayNodes.length - 1 }"
            >
              {{ index + 1 }}
            </div>
          </template>

          <div class="node-content">
            <div class="node-title">{{ node.title }}</div>

            <div class="node-info">
              <div class="info-line">计划完成时间：{{ node.planTime }}</div>
              <div class="info-line">
                实际完成时间：
                <span :style="{ color: node.actualTime ? '#52c41a' : '#faad14' }">
                  {{ node.actualTime || '未完成' }}
                </span>
              </div>
              <div class="info-line">提交人：{{ node.submitter }}</div>
            </div>
          </div>
        </TimelineItem>
      </Timeline>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div style="text-align: center">
        <Button type="primary" @click="emit('update:open', false)">
          关闭
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Drawer, Timeline, TimelineItem, Button, InputSearch } from 'ant-design-vue'
import type { PropType } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  nodes: {
    type: Array as PropType<Array<{
      title: string
      planTime: string
      actualTime?: string
      submitter: string
      color?: string
    }>>,
    default: () => []
  }
})

const emit = defineEmits(['update:open'])

const defaultNodes = ref([
  { title: '采购计划上报', planTime: '2026-02-05', actualTime: '2026-02-01', submitter: '姓名XXX', color: '#1890ff' },
  { title: '项目论证分析报告生效', planTime: '2026-02-05', actualTime: '2026-02-01', submitter: '姓名XXX', color: '#1890ff' },
  { title: '立项下达', planTime: '2026-02-05', actualTime: '2026-02-01', submitter: '姓名XXX', color: '#1890ff' },
  { title: '合同签订', planTime: '2026-02-05', actualTime: '2026-02-01', submitter: '姓名XXX', color: '#1890ff' }
])

const displayNodes = computed(() => props.nodes.length ? props.nodes : defaultNodes.value)

const drawerOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})
</script>

<style scoped>
.node-timeline {
  padding: 24px 0;
}

/* 自定义圆点 - 完全和截图一样 */
.custom-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #1890ff;
  color: #1890ff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

.custom-dot.current {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.node-content {
  margin-left: 12px;
}

.node-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
}

.node-info .info-line {
  font-size: 14px;
  color: #262626;
  line-height: 1.8;
  padding-left: 4px;
}

.node-info .info-line:not(:last-child) {
  margin-bottom: 4px;
}

/* 时间线样式 */
:deep(.ant-timeline-item-tail) {
  border-color: #d9d9d9;
}

:deep(.ant-timeline-item-head) {
  background-color: transparent;
}
</style>