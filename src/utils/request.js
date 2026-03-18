import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'

// ============================================================
// 1. 全局配置与状态管理
// ============================================================
const pendingMap = new Map() // 用于存储每个请求的 AbortController
let loadingInstance = null
let loadingCount = 0

/**
 * 开启全局 Loading
 */
function openLoading(config) {
    if (config.showLoading && loadingCount === 0) {
        loadingInstance = ElLoading.service({
            lock: true,
            text: '加载中...',
            background: 'rgba(0, 0, 0, 0.7)',
        })
    }
    if (config.showLoading) loadingCount++
}

/**
 * 关闭全局 Loading
 */
function closeLoading(config) {
    if (config.showLoading && loadingCount > 0) {
        loadingCount--
    }
    if (loadingCount === 0 && loadingInstance) {
        loadingInstance.close()
        loadingInstance = null
    }
}

/**
 * 生成唯一请求 Key
 */
function getRequestKey(config) {
    const { method, url, params, data } = config
    return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

/**
 * 移除并取消重复请求
 */
function removePending(config) {
    const key = getRequestKey(config)
    if (pendingMap.has(key)) {
        const controller = pendingMap.get(key)
        controller.abort() // 核心：真正取消网络请求
        pendingMap.delete(key)
    }
}

// ============================================================
// 2. 实例创建
// ============================================================
const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

// ============================================================
// 3. 请求拦截器
// ============================================================
service.interceptors.request.use(
    (config) => {
        // 默认配置（可在具体调用时覆盖）
        const options = {
            repeatCancel: true, // 是否开启重复请求取消
            showLoading: false, // 是否开启全屏 Loading
            ...config,
        }

        // 1. 处理重复请求取消 (防抖的底层实现)
        if (options.repeatCancel) {
            removePending(options)
            const controller = new AbortController()
            options.signal = controller.signal
            pendingMap.set(getRequestKey(options), controller)
        }

        // 2. 处理 Loading
        openLoading(options)

        // 3. Token 注入
        const token = localStorage.getItem('token')
        if (token) {
            options.headers.Authorization = `Bearer ${token}`
        }

        return options
    },
    (error) => Promise.reject(error)
)

// ============================================================
// 4. 响应拦截器
// ============================================================
service.interceptors.response.use(
    (response) => {
        const { config } = response
        removePending(config)
        closeLoading(config)

        const res = response.data

        // 业务状态码处理（根据后端约定修改）
        // 假设 200 或 0 是成功
        if (res.code !== 200 && res.code !== 0 && res.code !== undefined) {
            ElMessage.error(res.message || '系统开小差了')
            return Promise.reject(new Error(res.message || 'Error'))
        }

        return res.data || res // 直接返回数据主体
    },
    (error) => {
        // 清理状态
        if (error.config) {
            removePending(error.config)
            closeLoading(error.config)
        }

        // 如果是主动取消的请求，不弹框提示
        if (axios.isCancel(error)) {
            console.log('请求被自动去重取消:', error.message)
            return new Promise(() => { }) // 返回一个永远 pending 的 promise，防止进入业务层的 catch
        }

        // HTTP 异常状态码处理
        let message = ''
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    message = '登录过期，请重新登录'
                    // 这里可以执行登出操作，如：useUserStore().logout()
                    break
                case 403: message = '拒绝访问'; break
                case 404: message = '请求地址错误'; break
                case 500: message = '服务器内部错误'; break
                default: message = `系统异常 (${error.response.status})`
            }
        } else if (error.message.includes('timeout')) {
            message = '网络请求超时'
        } else {
            message = '网络连接异常'
        }

        ElMessage.error(message)
        return Promise.reject(error)
    }
)

/**
 * 5. 常用请求方法封装
 */
const request = {
    get(url, params, config = {}) {
        return service.get(url, { params, ...config })
    },
    post(url, data, config = {}) {
        return service.post(url, data, config)
    },
    put(url, data, config = {}) {
        return service.put(url, data, config)
    },
    delete(url, config = {}) {
        return service.delete(url, config)
    },
    // 专门用于文件上传
    upload(url, file, config = {}) {
        const formData = new FormData()
        formData.append('file', file)
        return service.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...config,
        })
    }
}

export default request
