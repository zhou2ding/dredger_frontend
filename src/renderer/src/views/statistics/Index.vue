<script setup>
import Search from './components/Search.vue'
import StatisticsTable from './components/StatisticTable.vue'
import BestConstruction from './components/BestConstruction.vue'
import StatisticPie from './components/StatisticPie.vue'
import ReplayData from './components/ReplayData.vue'
// Import nextTick from vue
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue' // 引入 watch
import searchApi from '../../api/search/index'
import { dayjs } from 'element-plus'
import * as echarts from 'echarts'
import { useLoadingStore } from '../../store/loadingStore'

// 定义一个变量，用来持有从 aip.getDownLoadSingle 返回的“注销函数”
let unregisterDownLoadSingle = null

// 使用 onMounted，在组件加载到页面上时执行
onMounted(() => {
  // 调用API注册监听，并把返回的“注销函数”保存到我们定义的变量中
  unregisterDownLoadSingle = window.api.getDownLoadSingle(async () => {
    await downLoadReport()
  })
})

// 使用 onUnmounted，在组件离开页面被销毁时执行
onUnmounted(() => {
  // 如果“注销函数”存在，就调用它来移除监听，防止内存泄漏和重复执行
  if (unregisterDownLoadSingle) {
    unregisterDownLoadSingle()
    unregisterDownLoadSingle = null // 清理变量是个好习惯
  }
})

const searchCondition = ref({
  //搜素条件
  startDate: 0,
  endDate: 0,
  shipName: ''
})

const time = ref(new Date().getTime())

const store = useLoadingStore()

const shiftsStaticData = ref([]) //班组统计表格几饼图数据数据

// ====================== 最优参数相关状态重构 ======================
const bestParamData = ref({}) // 改为存储按土质分的整个对象
const soilTypesForOptimal = ref([]) // 新增：存储所有可选的土质
const selectedSoilType = ref('') // 新增：存储当前选择的土质

const paramObj = ref({
  // 这个结构保持不变，用于传递给子组件
  shiftName: '',
  parameters: {
    horizontalSpeed: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0,
      warning: ''
    },
    carriageTravel: { min: 0, max: 10, average: 0, variance: 0, maxProductionParam: 0 },
    cutterDepth: { min: 0, max: 10, average: 0, variance: 0, maxProductionParam: 0 },
    sPumpRpm: { min: 0, max: 10, average: 0, variance: 0, maxProductionParam: 0 },
    concentration: { min: 0, max: 10, average: 0, variance: 0, maxProductionParam: 0 },
    flow: { min: 0, max: 10, average: 0, variance: 0, maxProductionParam: 0 },
    boosterPumpDischargePressure: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    vacuumDegree: { min: 0, max: 10, average: 0, variance: 0, maxProductionParam: 0 }
  }
})
// ===============================================================

const columnList = ref([]) //表格列名
const dataType = ref(1)

/**
 * 查询表格和饼图数据
 * @returns {Promise<void>}
 */
function getShiftsStatistics() {
  return searchApi.getShiftsStatistics(searchCondition.value).then((res) => {
    shiftsStaticData.value = res.data ?? []
    shiftsStaticData.value.forEach((item) => {
      item.workDuration = Number(item.workDuration.toFixed(3))
      item.totalProduction = Number(item.totalProduction.toFixed(3))
      item.totalEnergy = Number(item.totalEnergy.toFixed(3))
    })
  })
}

/**
 * 获取列表
 */
function getColumnList(shipName) {
  return searchApi.getColumnList(shipName).then((res) => {
    columnList.value = res.data ?? []
  })
}

/**
 * [已修改] 查询最优班组数据
 */
function getOptimalShifts() {
  return searchApi.getOptimalShifts(searchCondition.value).then((res) => {
    // 1. 重置状态
    bestParamData.value = {}
    soilTypesForOptimal.value = []
    selectedSoilType.value = ''

    const optimalData = res.data?.optimalShiftsBySoil
    if (optimalData && Object.keys(optimalData).length > 0) {
      // 2. 存储从API获取的完整数据
      bestParamData.value = optimalData
      // 3. 提取所有土质类型作为下拉框选项
      soilTypesForOptimal.value = Object.keys(optimalData)
      // 4. 默认选中第一个土质
      if (soilTypesForOptimal.value.length > 0) {
        selectedSoilType.value = soilTypesForOptimal.value[0]
      }
    } else {
      // 处理没有数据的情况，防止页面出错
      paramObj.value = JSON.parse(JSON.stringify(paramObj.value)) //
    }
    // `paramObj` 的更新将由 watch 自动触发
  })
}

/**
 * [新增] 更新最优参数显示
 * 这个函数会根据当前选择的土质和数据类型（最大产量/最小能耗）来更新 paramObj
 */
function updateBestParamDisplay() {
  if (!selectedSoilType.value || !bestParamData.value[selectedSoilType.value]) {
    // 如果没有选中的土质或该土质没有数据，则清空图表
    paramObj.value = {
      shiftName: '',
      parameters: {
        // ... 重置为初始空状态 ...
      }
    }
    return
  }

  const dataForSoil = bestParamData.value[selectedSoilType.value]

  if (dataType.value < 3) {
    // 最大产量
    paramObj.value = dataForSoil.maxProductionShift || paramObj.value
  } else {
    // 最小能耗
    paramObj.value = dataForSoil.minEnergyShift || paramObj.value
  }
}

// [修改] 使用 watch 替代 updateDateType 函数，逻辑更清晰
watch([dataType, selectedSoilType], () => {
  updateBestParamDisplay()
})

function getAllShiftParameters() {
  return searchApi.getAllShiftParameters(searchCondition.value).then((res) => {
    allShiftsParamsData.value = res.data ?? []
  })
}

function getTheoryOptimal() {
  return searchApi.getTheoryOptimal({ shipName: searchCondition.value.shipName }).then((res) => {
    theoryOptimalData.value = res.data ?? []
  })
}

/**
 * 查询搜索数据
 * @param obj
 */
async function searchData(obj) {
  store.setLoading(true)
  searchCondition.value = obj
  await Promise.all([
    getShiftsStatistics(),
    getOptimalShifts(),
    getColumnList(searchCondition.value.shipName),
    getAllShiftParameters(),
    getTheoryOptimal()
  ])
  time.value = new Date().getTime()
  store.setLoading(false)
}

const pieChart = ref(null)
const bestChart = ref(null)
const allShiftsParamsData = ref([]) // 所有班组的详细施工参数
const theoryOptimalData = ref([]) // 理论最优施工参数

/**
 * 辅助函数：为单个历史数据回放参数生成图表图片
 * @param {Array} data - ECharts series data, format: [[timestamp, value], ...]
 * @param {string} name - The Chinese name of the column (e.g., '流速')
 * @param {string} unit - The unit of the column (e.g., 'm/s')
 * @returns {string} - Base64 encoded image string
 */
function generateReplayChartImage(data, name, unit) {
  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [name]
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '6%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    dataZoom: [{ type: 'inside' }, {}],
    yAxis: {
      type: 'value',
      name: '单位：' + unit,
      nameTextStyle: {
        color: '#333333',
        nameLocation: 'start'
      },
      axisLine: {
        show: true
      }
    },
    series: [
      {
        name: name,
        type: 'line',
        data: data,
        smooth: true,
        large: true,
        largeThreshold: 10000,
        sampling: 'average'
      }
    ]
  }

  const chartContainer = document.createElement('div')
  chartContainer.style.width = '800px'
  chartContainer.style.height = '400px'
  const myChart = echarts.init(chartContainer)
  myChart.setOption(option)
  const imgBase64 = myChart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
  myChart.dispose()
  return imgBase64
}

/**
 * 导出分析报表文件
 */
async function downLoadReportFile() {
  store.setLoading(true)
  const pieImg = pieChart.value.exportChartAsImage()

  const optimalParamImages = []
  const originalSoilType = selectedSoilType.value
  const originalDataType = dataType.value

  // 暂时移除watch，避免不必要的触发。更简洁的方式是不需要手动移除watch，
  // 因为我们的循环是同步更改状态，然后异步等待。
  // 我们只需要确保在截图前有足够的渲染时间。

  // [修改] 只有敏龙才需要循环土质
  const soilTypesToLoop = searchCondition.value.shipName.includes('敏龙')
    ? soilTypesForOptimal.value
    : [selectedSoilType.value] // 华安龙只使用 'default'

  for (const soilType of soilTypesToLoop) {
    selectedSoilType.value = soilType

    for (const type of [1, 3]) {
      // 1: 最大产量, 3: 最小能耗
      dataType.value = type

      // 第一次 nextTick: 确保Vue的响应式系统已经将新的props传递给子组件
      await nextTick()
      // 这会触发子组件中的 watch，从而调用 mychart.setOption()

      // 【核心修改】
      // 添加一个短暂的延时，给 ECharts 足够的时间来完成重绘和布局计算。
      // 这是解决 markLine 标签位置问题的关键。
      await new Promise((resolve) => setTimeout(resolve, 100)) // 等待100毫秒

      const chartImage = bestChart.value.exportChartAsImage()
      const shiftName = paramObj.value.shiftName

      if (chartImage) {
        const titleSoilPart = searchCondition.value.shipName.includes('敏龙')
          ? `${soilType} - `
          : ''
        optimalParamImages.push({
          title: `${titleSoilPart}${type === 1 ? '最大产量' : '最小能耗'} (${shiftName})`,
          src: chartImage
        })
      }
    }
  }

  // 恢复循环之前的状态，让界面显示回到用户的原始选择
  selectedSoilType.value = originalSoilType
  dataType.value = originalDataType
  await nextTick() // 确保UI更新回原始状态

  // ... (省略后面生成其他图片和发送数据的代码，它们是正确的，无需修改)
  // ... (后面的 replayChartImages 和 comparisonTableData 逻辑保持不变)

  const replayChartImages = []
  const requiredColumns = ['流速', '密度', '产量', '小时产量率', '水下泵排出压力', '升压泵排出压力']
  const targetColumns = columnList.value.filter((col) =>
    requiredColumns.includes(col.columnChineseName)
  )

  if (targetColumns.length > 0) {
    const dataPromises = targetColumns.map((col) =>
      searchApi.getReplayData(col.columnName, searchCondition.value)
    )
    const results = await Promise.all(dataPromises)

    results.forEach((res, index) => {
      const rawData = res.data ?? []
      const chartData = rawData.map((item) => [item.timestamp, item.value])
      const columnInfo = targetColumns[index]
      const image = generateReplayChartImage(
        chartData,
        columnInfo.columnChineseName,
        columnInfo.columnUnit
      )
      replayChartImages.push({
        title: columnInfo.columnChineseName,
        src: image
      })
    })
  }

  const optimalSoilKey = searchCondition.value.shipName.includes('敏龙')
    ? selectedSoilType.value
    : 'default'

  const comparisonTableData = {
    theory: theoryOptimalData.value,
    shifts: allShiftsParamsData.value,
    optimalShiftNames: {
      maxProduction: bestParamData.value[optimalSoilKey]?.maxProductionShift?.shiftName,
      minEnergy: bestParamData.value[optimalSoilKey]?.minEnergyShift?.shiftName
    }
  }

  let obj = {
    shiftName: JSON.parse(JSON.stringify(searchCondition.value.shipName)),
    startTime: JSON.parse(JSON.stringify(searchCondition.value.startDate)),
    endTime: JSON.parse(JSON.stringify(searchCondition.value.endDate)),
    pieImg: pieImg,
    optimalParamImages: optimalParamImages,
    tableData: JSON.parse(JSON.stringify(shiftsStaticData.value)),
    comparisonData: JSON.parse(JSON.stringify(comparisonTableData)),
    replayChartImages: replayChartImages
  }
  window.api.postReportMessage(obj)
  store.setLoading(false)
}

async function downLoadReport() {
  const padBuffer = await window.api.downLoadReport()
  const blob = new Blob([padBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download =
    searchCondition.value.shipName +
    dayjs(searchCondition.value.startDate).format('YYYY-MM-DD-HH-mm-ss') +
    '至' +
    dayjs(searchCondition.value.endDate).format('YYYY-MM-DD-HH-mm-ss') +
    '统计分析.pdf'
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}
</script>

<template>
  <div v-loading="store.getLoadingState" class="statistics-index">
    <div class="header">
      <Search @search-data="searchData" @down-load-report-file="downLoadReportFile"></Search>
    </div>
    <div class="content">
      <div class="floor floor-1">
        <div class="statistics-table">
          <StatisticsTable
            :table-data="shiftsStaticData"
            :ship-name="searchCondition.shipName"
          ></StatisticsTable>
        </div>
        <div class="shifts-param">
          <BestConstruction
            ref="bestChart"
            :best-param="paramObj.parameters"
            :shift-name="paramObj.shiftName"
            :time="time"
            :ship-name="searchCondition.shipName"
          >
            <template v-if="searchCondition.shipName.includes('敏龙')" #title-right>
              <div class="soil-type-wrapper">
                <span class="selector-label">土质:</span>
                <el-select
                  v-model="selectedSoilType"
                  placeholder="选择土质"
                  size="small"
                  style="width: 180px"
                >
                  <el-option
                    v-for="item in soilTypesForOptimal"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </div>
            </template>
          </BestConstruction>
        </div>
      </div>
      <div class="floor floor-2">
        <div class="shifts-time">
          <StatisticPie
            ref="pieChart"
            v-model="dataType"
            :shifts-static-data="shiftsStaticData"
            :time="time"
          ></StatisticPie>
        </div>
        <div class="history-data">
          <ReplayData
            :column-list="columnList"
            :search-condition="searchCondition"
            :time="time"
          ></ReplayData>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics-index {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  width: 100%;
  height: 76px;
}

.content {
  flex: 1;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
}
.floor {
  display: flex;
  width: 100%;
}
.floor-1 {
  height: 460px;
}
.statistics-table {
  padding: 0 20px;
  width: 50%;
  height: 300px;
}
.shifts-param {
  padding: 0 20px;
  width: 50%;
  height: 460px;
}

.floor-2 {
  height: 460px;
}
.shifts-time {
  padding: 0 20px;
  width: 50%;
  height: 440px;
}
.history-data {
  padding: 0 20px;
  width: 50%;
  height: 440px;
}

/* ====================== 土质选择器新样式 ====================== */
/* 这个样式现在定义在 Index.vue 中，用于控制插槽内容 */
.soil-type-wrapper {
  display: flex;
  align-items: center;
  /* 可选：添加一些左边距，与标题保持距离 */
  margin-left: 10px;
}

.selector-label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* 如果需要更精确控制 Element Plus Select，可以使用深度选择器 */
/* ::v-deep(.el-select) {
  width: 100%;
} */

/* 重要：移除 BestConstruction.vue 中可能存在的 .soil-type-selector 样式，
   因为我们现在在 Index.vue 中直接控制它。 */
</style>
