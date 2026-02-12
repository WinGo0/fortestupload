import axios from 'axios'

// ============================================================
// 1. 创建 axios 实例
// ============================================================
const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// ============================================================
// 2. 请求去重（Cancel Duplicate Requests）
//    - 同一个接口在前一次请求未完成时，再次发起相同请求会自动取消前一次
//    - 通过 url + method + params/data 生成唯一 key
//    - 可通过 config.cancelDuplicate = false 关闭（默认开启）
// ============================================================
const pendingMap = new Map()

/**
 * 生成请求的唯一标识
 * @param {import('axios').InternalAxiosRequestConfig} config
 * @returns {string}
 */
function generateRequestKey(config) {
    const { url, method, params, data } = config
    // 使用 JSON.stringify 时对 data 做安全处理
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data || {})
    const paramsStr = JSON.stringify(params || {})
    return `${method}:${url}:${paramsStr}:${dataStr}`
}

/**
 * 将请求添加到 pendingMap，如果已经存在则取消之前的请求
 */
function addPending(config) {
    const key = generateRequestKey(config)

    // 如果已有相同请求正在进行，取消它
    if (pendingMap.has(key)) {
        const abortController = pendingMap.get(key)
        abortController.abort('请求被取消：重复请求')
        pendingMap.delete(key)
    }

    // 创建新的 AbortController
    const controller = new AbortController()
    config.signal = controller.signal
    pendingMap.set(key, controller)
}

/**
 * 请求完成后从 pendingMap 中移除
 */
function removePending(config) {
    const key = generateRequestKey(config)
    pendingMap.delete(key)
}

// ============================================================
// 3. 请求拦截器
// ============================================================
service.interceptors.request.use(
    (config) => {
        // 默认开启请求去重，可通过 cancelDuplicate: false 关闭
        if (config.cancelDuplicate !== false) {
            addPending(config)
        }

        // 这里可以添加 token
        // const token = localStorage.getItem('token')
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`
        // }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// ============================================================
// 4. 响应拦截器
// ============================================================
service.interceptors.response.use(
    (response) => {
        // 请求完成，从 pendingMap 中移除
        removePending(response.config)

        // 根据业务约定处理返回值，按需调整
        const res = response.data
        // 例如：如果后端约定 code !== 200 为异常
        // if (res.code !== 200) {
        //   ElMessage.error(res.message || '请求失败')
        //   return Promise.reject(new Error(res.message || '请求失败'))
        // }
        return res
    },
    (error) => {
        // 请求失败也要从 pendingMap 中移除
        if (error.config) {
            removePending(error.config)
        }

        // 被取消的请求不需要提示错误
        if (axios.isCancel(error)) {
            console.log('请求被取消：', error.message)
            return Promise.reject(error)
        }

        // 处理 HTTP 错误状态码
        const status = error.response?.status
        const errorMessages = {
            400: '请求参数错误',
            401: '未授权，请重新登录',
            403: '拒绝访问',
            404: '请求地址不存在',
            408: '请求超时',
            500: '服务器内部错误',
            502: '网关错误',
            503: '服务不可用',
            504: '网关超时',
        }
        const message = errorMessages[status] || `连接错误 ${status || ''}`
        console.error(message)

        // 可以集成 ElMessage 进行提示
        // ElMessage.error(message)

        return Promise.reject(error)
    }
)

// ============================================================
// 5. 取消所有进行中的请求（用于路由切换等场景）
// ============================================================
export function cancelAllPending() {
    pendingMap.forEach((controller) => {
        controller.abort('路由切换，取消所有请求')
    })
    pendingMap.clear()
}

// ============================================================
// 6. 导出封装好的请求方法
// ============================================================
export default service
