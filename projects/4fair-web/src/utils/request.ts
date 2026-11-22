/**
 * Axios HTTP 请求工具
 * 配置拦截器统一处理 token 和错误
 */
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { clearAuthLocalStorage, readAuthToken } from '@/utils/authSession'

const BASE_URL = '' // 使用 Vite proxy

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动附加 token
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = readAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 统一处理错误
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          // 仅在有 JWT 时清除整站登录态；微信扫码登录通常只有 auth_user
          if (readAuthToken()) {
            clearAuthLocalStorage()
            const redirect = encodeURIComponent(
              `${window.location.pathname}${window.location.search}${window.location.hash}`
            )
            window.location.href = `/login?redirect=${redirect}`
          }
          break
        case 403:
          console.error('权限不足:', data?.message || '无访问权限')
          break
        case 500:
          console.error('服务器错误:', data?.message || '服务器异常')
          break
        default:
          console.error(`请求错误 [${status}]:`, data?.message || '未知错误')
      }
    } else if (error.request) {
      console.error('网络错误: 无法连接到服务器')
    }
    return Promise.reject(error)
  }
)

export default request
