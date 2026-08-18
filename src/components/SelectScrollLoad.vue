<template>
  <div class="select-scroll-demo">
    <h3>El-Select 下拉滚动加载 (pageSize: 20)</h3>
    <el-select
      v-model="selectedValue"
      filterable
      remote
      :remote-method="onRemoteSearch"
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
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  searchValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const PAGE_SIZE = 20
const TOTAL = 156

const selectedValue = ref(props.modelValue || '')
const optionList = ref([])
const currentPage = ref(0)
const loading = ref(false)
const hasMore = ref(true)
const keyword = ref('')

// 生成全部数据并支持关键字过滤
const fetchOptions = async (page, kw = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allItems = []
      for (let i = 1; i <= TOTAL; i++) {
        const label = `选项 ${i} - ${String.fromCharCode(64 + (i % 26 || 26))}`
        if (!kw || label.toLowerCase().includes(kw.toLowerCase())) {
          allItems.push({ value: `option-${i}`, label })
        }
      }
      const start = page * PAGE_SIZE
      const items = allItems.slice(start, start + PAGE_SIZE)
      resolve({ items, total: allItems.length })
    }, 600)
  })
}

// 加载指定页（远程搜索时从第 0 页开始）
const loadPage = async (page, kw = '') => {
  console.log('sss',page);
  console.log('kw',kw);
  
  if (loading.value) return
  loading.value = true
  const { items, total } = await fetchOptions(page, kw)
  if (page === 0) {
    optionList.value = items
  } else {
    optionList.value = [...optionList.value, ...items]
  }
  currentPage.value = page
  hasMore.value = optionList.value.length < total
  loading.value = false
}

// 用户输入搜索时触发
const onRemoteSearch = (query) => {
  keyword.value = query
  currentPage.value = 0
  hasMore.value = true
  loadPage(0, query)
}

// 滚动到底部加载下一页
const loadNextPage = async () => {
  if (loading.value || !hasMore.value) return
  loadPage(currentPage.value + 1, keyword.value)
}

const onVisibleChange = async (visible) => {
  if (visible) {
    // 首次展开时加载第一页
    if (optionList.value.length === 0) {
      await loadPage(0, keyword.value)
    }
    // 绑定滚动事件到下拉面板
    await nextTick()
    bindScroll()
  } else {
    unbindScroll()
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

// 挂载时带父组件传入的 searchValue 进行初始搜索
onMounted(async () => {
  if (props.searchValue) {
    keyword.value = props.searchValue
    await loadPage(0, props.searchValue)
  }
})
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
