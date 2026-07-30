<template>
  <div class="select-scroll-demo">
    <h3>El-Select 下拉滚动加载 (pageSize: 20)</h3>
    <el-select
      v-model="selectedValue"
      filterable
      clearable
      placeholder="请选择选项"
      style="width: 400px"
      @visible-change="onVisibleChange"
    >
      <el-option
        v-for="item in optionList"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
      <el-option v-if="loading" disabled value="" class="scroll-loading-option">
        <span class="loading-text">加载中...</span>
      </el-option>
      <el-option v-if="!hasMore && optionList.length > 0" disabled value="" class="no-more-option">
        <span class="no-more-text">没有更多了</span>
      </el-option>
    </el-select>
    <div class="selected-info" v-if="selectedValue">
      已选: {{ selectedValue }}
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const PAGE_SIZE = 20
const TOTAL = 156

const selectedValue = ref('')
const optionList = ref([])
const currentPage = ref(0)
const loading = ref(false)
const hasMore = ref(true)

// 模拟异步请求数据
const fetchOptions = async (page) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = page * PAGE_SIZE
      const count = Math.min(PAGE_SIZE, TOTAL - start)
      const items = []
      for (let i = 0; i < count; i++) {
        const idx = start + i + 1
        items.push({
          value: `option-${idx}`,
          label: `选项 ${idx} - ${String.fromCharCode(64 + (idx % 26 || 26))}`
        })
      }
      resolve({ items, total: TOTAL })
    }, 600)
  })
}

// 加载下一页
const loadNextPage = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  const nextPage = currentPage.value + 1
  const { items } = await fetchOptions(nextPage)
  optionList.value = [...optionList.value, ...items]
  currentPage.value = nextPage
  hasMore.value = optionList.value.length < TOTAL
  loading.value = false
}

const onVisibleChange = async (visible) => {
  if (visible) {
    // 首次展开时加载第一页
    if (optionList.value.length === 0) {
      await loadNextPage()
    }
    // 绑定滚动事件到下拉面板
    await nextTick()
    bindScroll()
  } else {
    unbindScroll()
    // 关闭后重置，下次打开重新加载
    optionList.value = []
    currentPage.value = 0
    hasMore.value = true
  }
}

const onScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  // 距离底部 5px 时触发加载
  if (scrollHeight - scrollTop - clientHeight < 5) {
    loadNextPage()
  }
}

let scrollEl = null
const bindScroll = () => {
  const wrap = document.querySelector('.el-select-dropdown__wrap')
  if (wrap) {
    scrollEl = wrap
    scrollEl.addEventListener('scroll', onScroll)
  }
}

const unbindScroll = () => {
  if (scrollEl) {
    scrollEl.removeEventListener('scroll', onScroll)
    scrollEl = null
  }
}
</script>

<style scoped>
.select-scroll-demo {
  padding: 20px;
  background: #1a1a2e;
  border-radius: 8px;
  width: 460px;
}

h3 {
  margin: 0 0 16px 0;
  color: #e0e0e0;
  font-size: 16px;
}

.selected-info {
  margin-top: 12px;
  color: #a0d2ff;
  font-size: 14px;
}
</style>

<style>
.scroll-loading-option {
  text-align: center;
  cursor: default !important;
}
.scroll-loading-option .loading-text {
  color: #909399;
  font-size: 13px;
}
.no-more-option {
  text-align: center;
  cursor: default !important;
}
.no-more-option .no-more-text {
  color: #c0c4cc;
  font-size: 13px;
}
</style>
