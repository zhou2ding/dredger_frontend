import axios from 'axios'

const service = axios.create({
  baseURL: 'http://127.0.0.1:12580',
  timeout: 600 * 1000
})
import { ElMessage } from 'element-plus'

/**
 * 封装request请求
 */

service.interceptors.request.use(
  (config) => {
    config.headers = {
      // 'Content-Type': 'application/x-www-form-urlencoded',
      // 'auth': cacheUserInfo ? JSON.parse(cacheUserInfo).AuthToken : '',
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
const CODE_TO_MSG = {}
/**
 * 封装response返回
 */
service.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      let responseData = response.data
      let obj = {
        data: [],
        total: ''
      }
      if (
        responseData.type === 'application/octet-stream' ||
        responseData.type === 'application/pdf' ||
        responseData.type === 'application/zip'
      ) {
        return Promise.resolve(responseData)
      }
      if (!responseData.Errors) {
        obj.data = responseData.data ?? []
        obj.total = responseData.total
        return Promise.resolve(obj)
      }
      // 错误码预先判断
      const code = responseData.Errors[0].Code
      const msg = responseData.Errors[0].Msg
      return Promise.reject({
        code: code || 0,
        msg: msg || 'Connect Server Error'
      })
    }
  },
  (error) => {
    if (error && error.response) {
      let errCode = error.response.data.errors[0]
      error.message = CODE_TO_MSG[errCode.code] ?? errCode.msg
    } else {
      error.message = 'Connect Server Timeout .'
    }
    ElMessage.error(error.message)
    return Promise.reject({
      code: error.code,
      msg: error.message
    })
  }
)

export default service
