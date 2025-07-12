<script setup>
import Search from './components/Search.vue'
import StatisticsTable from './components/StatisticTable.vue'
import BestConstruction from './components/BestConstruction.vue'
import StatisticPie from './components/StatisticPie.vue'
import ReplayData from './components/ReplayData.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import searchApi from '../../api/search/index'
import { dayjs } from 'element-plus'

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
import { useLoadingStore } from '../../store/loadingStore'

const store = useLoadingStore()

const shiftsStaticData = ref([]) //班组统计表格几饼图数据数据

const bestParamData = ref({}) //最优班组施工参数
const paramObj = ref({
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
    carriageTravel: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    cutterDepth: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    sPumpRpm: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    concentration: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    flow: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    boosterPumpDischargePressure: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    },
    vacuumDegree: {
      min: 0,
      max: 10,
      average: 0,
      variance: 0,
      maxProductionParam: 0
    }
  }
})
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
 * 查询最优班组数据
 */
function getOptimalShifts() {
  return searchApi.getOptimalShifts(searchCondition.value).then((res) => {
    const obj = {
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
        carriageTravel: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        },
        cutterDepth: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        },
        sPumpRpm: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        },
        concentration: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        },
        flow: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        },
        boosterPumpDischargePressure: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        },
        vacuumDegree: {
          min: 0,
          max: 10,
          average: 0,
          variance: 0,
          maxProductionParam: 0
        }
      }
    }
    if (res.data && res.data.maxProductionShift && res.data.minEnergyShift) {
      bestParamData.value = res.data
    } else {
      bestParamData.value = {
        maxProductionShift: JSON.parse(JSON.stringify(obj)),
        minEnergyShift: JSON.parse(JSON.stringify(obj))
      }
    }
    if (dataType.value < 3) {
      paramObj.value = bestParamData.value.maxProductionShift
    } else {
      paramObj.value = bestParamData.value.minEnergyShift
    }
  })
}

function updateDateType() {
  if (dataType.value < 3) {
    paramObj.value = bestParamData.value.maxProductionShift
  } else {
    paramObj.value = bestParamData.value.minEnergyShift
  }
}

function getAllShiftParameters() {
  return searchApi.getAllShiftParameters(searchCondition.value).then((res) => {
    allShiftsParamsData.value = res.data ?? []
  })
}

function getTheoryOptimal() {
  return searchApi.getTheoryOptimal({ shipName: searchCondition.value.shipName }).then((res) => {
    theoryOptimalData.value = res.data ?? null
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
const theoryOptimalData = ref(null) // 理论最优施工参数
/**
 * 导出分析报表文件
 */
function downLoadReportFile() {
  const pieImg = pieChart.value.exportChartAsImage()
  const scatterImg = bestChart.value.exportChartAsImage()

  // === 构造新的对比表格数据 ===
  const comparisonTableData = {
    // 理论参数
    theory: theoryOptimalData.value,
    // 各班组实际参数
    shifts: allShiftsParamsData.value,
    // 最优班组名称，用于标注
    optimalShiftNames: {
      maxProduction: bestParamData.value?.maxProductionShift?.shiftName,
      minEnergy: bestParamData.value?.minEnergyShift?.shiftName
    }
  }

  let obj = {
    shiftName: JSON.parse(JSON.stringify(searchCondition.value.shipName)),
    startTime: JSON.parse(JSON.stringify(searchCondition.value.startDate)),
    endTime: JSON.parse(JSON.stringify(searchCondition.value.endDate)),
    pieImg: pieImg,
    scatterImg: scatterImg,
    tableData: JSON.parse(JSON.stringify(shiftsStaticData.value)),
    comparisonData: JSON.parse(JSON.stringify(comparisonTableData))
  }
  window.api.postReportMessage(obj)
}

async function downLoadReport() {
  const padBuffer = await window.api.downLoadReport()
  const blob = new Blob([padBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // 船名+施工日期段统计分析dayjs(exportInfo.startTime).format('YYYY-MM-DD')
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
          <StatisticsTable :table-data="shiftsStaticData"></StatisticsTable>
        </div>
        <div class="shifts-param">
          <BestConstruction
            ref="bestChart"
            :time="time"
            :best-param="paramObj.parameters"
            :shift-name="paramObj.shiftName"
          ></BestConstruction>
        </div>
      </div>
      <div class="floor floor-2">
        <div class="shifts-time">
          <StatisticPie
            ref="pieChart"
            v-model="dataType"
            :shifts-static-data="shiftsStaticData"
            :time="time"
            @updateDateType="updateDateType"
          ></StatisticPie>
        </div>
        <div class="history-data">
          <ReplayData
            :searchCondition="searchCondition"
            :column-list="columnList"
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

  .header {
    width: 100%;
    height: 76px;
  }

  .content {
    flex: 1;
    padding: 0 20px;
    display: flex;
    flex-direction: column;

    .floor {
      display: flex;
      width: 100%;
    }

    .floor-1 {
      height: 460px;

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
    }

    .floor-2 {
      height: 460px;

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
    }
  }
}
</style>
