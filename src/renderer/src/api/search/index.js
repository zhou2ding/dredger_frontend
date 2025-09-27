// search/index.js

import http from '../http'

/**
 * 上传文件
 * @param formData
 * @returns {*}
 */
function uploadFile(formData) {
  return http.putFormData('/v1/data/import', formData)
}

/**
 * 查询班组统计表格/查询班组施工数据饼图数据
 * @param params
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getShiftsStatistics(params) {
  return http.get('/v1/shifts/statistics', params)
}

/**
 * 查询最优班组施工参数
 * @param params
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getOptimalShifts(params) {
  return http.get('/v1/shifts/optimal', params)
}

/**
 * 历史数据回放
 * @param columnName 列名
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getReplayData(columnName, params) {
  return http.get(`/v1/data/replay/${columnName}`, params)
}

/**
 * 获取列名
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getColumnList(shipName) {
  return http.get(`/v1/data/column/list/${shipName}`)
}

/**
 * 获取船名列表
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getShipList() {
  return http.get('/v1/ship/list')
}

/**
 * 获取所有数据的有效日期
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getAllShipEffectiveDate() {
  return http.get('/v1/data/timerange/global')
}

/**
 * 根据船名获取该穿某段时间段内的有数据的日期
 * @param params
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getShipEffectiveDate(params) {
  return http.get('/v1/data/timerange/nonempty', params)
}

/**
 * 设置理论最优施工参数
 * @param params
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function setTheoryOptimal(params) {
  return http.post('/v1/data/theory/optimal', params)
}

/**
 * 获取理论最优参数
 * @param params { shipName: string }
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
function getTheoryOptimal(params) {
  return http.get('/v1/data/theory/optimal', params)
}

function getAllShiftParameters(params) {
  return http.get('/v1/shifts/parameters', params)
}

// 这个方法可以保留，可能其他地方还在用
function generateSolid(params) {
  return http.post('/v1/solid/gen', params)
}

/**
 * [修改后] 运行demo（上传表单+文件）
 * @param {number} demoId
 * @param {FormData} formData
 * @returns
 */
function runDemo(demoId, formData) {
  return http.postFormData(`/v1/demos/run?demo=${demoId}`, formData)
}

/**
 * [新增] 获取指定demo的最新计算结果
 * @param {string} ids - 逗号分隔的demo id, e.g., "1,2"
 * @returns
 */
function getLatestResults(ids) {
  return http.get('/v1/demos/results/latest', { ids })
}

/**
 * [新增] 获取文件内容用于预览
 * @param {string} path - 文件的服务器路径
 * @returns
 */
function serveFile(path) {
  const extension = path.split('.').pop().toLowerCase()
  const url = `/v1/files/serve?path=${encodeURIComponent(path)}`

  // 默认配置是请求文本
  const config = {
    responseType: 'text'
  }

  // 对二进制文件（图片、xlsx等）特别设置 responseType
  if (['png', 'xlsx'].includes(extension)) {
    config.responseType = 'arraybuffer'
  }

  // 假设你的 http.get 包装器能够正确地将第三个参数作为axios的配置对象
  // 这是标准的axios用法: axios.get(url, { params: {}, ...config })
  // 我们这里没有params，所以第二个参数传null
  return http.get(url, null, config)
}

/**
 * [新增] 请求后端打开文件所在的目录
 * @param {string} path 文件的服务器路径
 * @returns
 */
function openFileLocation(path) {
  return http.post('/v1/files/open-location', { path })
}

export default {
  uploadFile,
  getShiftsStatistics,
  getOptimalShifts,
  getReplayData,
  getColumnList,
  getShipList,
  getAllShipEffectiveDate,
  getShipEffectiveDate,
  setTheoryOptimal,
  getTheoryOptimal,
  getAllShiftParameters,
  generateSolid,

  // 替换为修改和新增后的方法
  runDemo,
  getLatestResults,
  serveFile,
  openFileLocation
}
