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
  getTheoryOptimal
}
