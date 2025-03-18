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
function getColumnList() {
  return http.get('/v1/data/column/list')
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

export default {
  uploadFile,
  getShiftsStatistics,
  getOptimalShifts,
  getReplayData,
  getColumnList,
  getShipList,
  getAllShipEffectiveDate,
  getShipEffectiveDate
}
