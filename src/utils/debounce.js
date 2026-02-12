import { ref } from 'vue'

// ============================================================
// 方案一：通用防抖函数（替代 lodash.debounce）
//   - 支持 leading / trailing 配置
//   - 支持取消 cancel()
//   - 支持立即执行 flush()
// ============================================================

/**
 * 通用防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒），默认 300ms
 * @param {object} options
 * @param {boolean} options.leading  - 是否在延迟开始前立即调用，默认 false
 * @param {boolean} options.trailing - 是否在延迟结束后调用，默认 true
 * @returns {Function & { cancel: Function, flush: Function }}
 */
export function debounce(fn, delay = 300, options = {}) {
    const { leading = false, trailing = true } = options
    let timer = null
    let lastArgs = null
    let lastThis = null
    let result

    function invoke() {
        if (lastArgs) {
            result = fn.apply(lastThis, lastArgs)
            lastArgs = lastThis = null
        }
    }

    function debounced(...args) {
        lastArgs = args
        lastThis = this

        // leading 模式：第一次立即执行
        if (leading && !timer) {
            invoke()
        }

        clearTimeout(timer)
        timer = setTimeout(() => {
            if (trailing) {
                invoke()
            }
            timer = null
        }, delay)

        return result
    }

    /** 取消防抖，不再执行 */
    debounced.cancel = () => {
        clearTimeout(timer)
        timer = null
        lastArgs = lastThis = null
    }

    /** 立即执行（如果有待执行的调用） */
    debounced.flush = () => {
        if (timer) {
            clearTimeout(timer)
            invoke()
            timer = null
        }
    }

    return debounced
}

// ============================================================
// 方案二：提交防抖（专门用于按钮 / 表单提交场景）
//   - 第一次点击立即执行
//   - 请求期间忽略所有重复点击
//   - 不是按时间延迟，而是按「请求是否完成」来控制
// ============================================================

/**
 * 创建一个"提交锁"，防止重复提交
 * @param {Function} fn - 异步提交函数（必须返回 Promise）
 * @returns {{ exec: Function, loading: import('vue').Ref<boolean> }}
 *
 * @example
 * const { exec: submitForm, loading } = createSubmitLock(async (formData) => {
 *   await request.post('/api/submit', formData)
 * })
 *
 * // template 中
 * <el-button :loading="loading" @click="submitForm(form)">提交</el-button>
 */
export function createSubmitLock(fn) {
    const loading = ref(false)

    async function exec(...args) {
        if (loading.value) return // 正在请求中，忽略
        loading.value = true
        try {
            const result = await fn(...args)
            return result
        } catch (error) {
            throw error
        } finally {
            loading.value = false
        }
    }

    return { exec, loading }
}

// ============================================================
// 方案三：Vue 3 Composable —— useDebounceRequest
//   - 搜索框等场景，输入时防抖请求
//   - 自带 loading / data / error 状态
//   - 自动取消过期的请求
// ============================================================

/**
 * 用于搜索/筛选等场景的防抖请求 composable
 * @param {Function} requestFn - 请求函数，接收参数，返回 Promise
 * @param {object} options
 * @param {number} options.delay - 防抖延迟，默认 300ms
 * @param {boolean} options.immediate - 是否立即执行第一次，默认 false
 * @returns {{ loading, data, error, run, cancel }}
 *
 * @example
 * const { loading, data, run: search } = useDebounceRequest(
 *   (keyword) => request.get('/api/search', { params: { keyword } }),
 *   { delay: 500 }
 * )
 *
 * // 在 watch 或 @input 中调用
 * watch(keyword, (val) => search(val))
 */
export function useDebounceRequest(requestFn, options = {}) {
    const { delay = 300, immediate = false } = options

    const loading = ref(false)
    const data = ref(null)
    const error = ref(null)

    let timer = null
    let currentController = null
    let callCount = 0 // 用于丢弃过期的响应

    /**
     * 取消当前的防抖等待和进行中的请求
     */
    function cancel() {
        clearTimeout(timer)
        timer = null
        if (currentController) {
            currentController.abort('新请求覆盖旧请求')
            currentController = null
        }
    }

    /**
     * 实际发起请求
     */
    async function executeRequest(args, expectedCount) {
        // 取消之前的请求
        if (currentController) {
            currentController.abort('新请求覆盖旧请求')
        }

        const controller = new AbortController()
        currentController = controller
        loading.value = true
        error.value = null

        try {
            const result = await requestFn(...args, { signal: controller.signal })
            // 只处理最新的请求结果
            if (expectedCount === callCount) {
                data.value = result
            }
        } catch (err) {
            if (expectedCount === callCount && !controller.signal.aborted) {
                error.value = err
            }
        } finally {
            if (expectedCount === callCount) {
                loading.value = false
            }
            if (currentController === controller) {
                currentController = null
            }
        }
    }

    /**
     * 触发防抖请求
     */
    function run(...args) {
        callCount++
        const currentCount = callCount

        clearTimeout(timer)

        if (immediate && !timer) {
            executeRequest(args, currentCount)
            // 设置一个占位 timer 防止后续立即执行
            timer = setTimeout(() => {
                timer = null
            }, delay)
        } else {
            timer = setTimeout(() => {
                executeRequest(args, currentCount)
                timer = null
            }, delay)
        }
    }

    return {
        loading,
        data,
        error,
        run,
        cancel,
    }
}

// ============================================================
// 方案四：节流函数（高频触发场景，如滚动、resize）
// ============================================================

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 节流间隔（毫秒），默认 200ms
 * @returns {Function & { cancel: Function }}
 */
export function throttle(fn, interval = 200) {
    let lastTime = 0
    let timer = null

    function throttled(...args) {
        const now = Date.now()
        const remaining = interval - (now - lastTime)

        if (remaining <= 0) {
            clearTimeout(timer)
            timer = null
            lastTime = now
            fn.apply(this, args)
        } else if (!timer) {
            timer = setTimeout(() => {
                lastTime = Date.now()
                timer = null
                fn.apply(this, args)
            }, remaining)
        }
    }

    throttled.cancel = () => {
        clearTimeout(timer)
        timer = null
        lastTime = 0
    }

    return throttled
}
