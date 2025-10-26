<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { dayjs } from 'element-plus'

// 定义一个变量用于保存注销函数
let unregisterGetReportMessage = null

onMounted(() => {
  // 注册监听，并保存注销函数
  unregisterGetReportMessage = window.api.getReportMessage(async (message) => {
    exportInfo.value = message
    await nextTick()
    window.api.readyDownload()
  })
})

onUnmounted(() => {
  // 组件销毁时移除监听
  if (unregisterGetReportMessage) {
    unregisterGetReportMessage()
  }
})

const exportInfo = ref({
  shiftName: '',
  startTime: '',
  endTime: '',
  pieImg: '',
  // ====================== 核心修改点 1: 数据结构变更 ======================
  // 将 scatterImg 替换为 optimalParamImages 数组
  optimalParamImages: [],
  // ======================================================================
  tableData: [],
  comparisonData: {
    theory: null,
    shifts: [],
    optimalShiftNames: {}
  },
  replayChartImages: []
})

// computed 属性用来处理和转换数据，使其适用于 el-table
const comparisonTable = computed(() => {
  const data = exportInfo.value.comparisonData
  if (!data || !data.shifts || data.shifts.length === 0) {
    return { columns: [], rows: [] }
  }

  const columns = [
    { prop: 'paramName', label: '参数名称', width: '150' },
    { prop: 'unit', label: '单位', width: '100' },
    {
      prop: 'theoretical',
      label: '理论最优值'
    }
  ]
  data.shifts.forEach((shift) => {
    let label = shift.shiftName
    if (shift.shiftName === data.optimalShiftNames.maxProduction) {
      label += '(最高产量)'
    }
    if (shift.shiftName === data.optimalShiftNames.minEnergy) {
      label += '(最低能耗)'
    }
    columns.push({
      prop: shift.shiftName,
      label: label
    })
  })

  const paramKeys = {
    flow: '流量 (m³/h)',
    concentration: '浓度 (%)',
    sPumpRpm: '水下泵转速 (rpm)',
    cutterDepth: '绞刀深度 (m)',
    carriageTravel: '台车行程 (m)',
    horizontalSpeed: '横移速度 (m/min)',
    boosterPumpDischargePressure: '升压泵排出压力 (bar)',
    vacuumDegree: '真空度 (kPa)'
  }

  const rows = Object.keys(paramKeys).map((key) => {
    const [name, unit] = paramKeys[key].split(' (')
    const rowData = {
      paramName: name,
      unit: unit ? `(${unit}` : '',
      theoretical: data.theory ? data.theory[key] : 'N/A'
    }
    data.shifts.forEach((shift) => {
      rowData[shift.shiftName] = shift.parameters[key]?.average ?? 'N/A'
    })
    return rowData
  })

  return { columns, rows }
})

// 新增：用于格式化土质数组的方法
const formatSoilTypes = (row, column, cellValue) => {
  if (Array.isArray(cellValue) && cellValue.length > 0) {
    return cellValue.join(', ')
  }
  return '—'
}
</script>

<template>
  <div class="export-index">
    <div class="floor">
      <div class="name">船名</div>
      <div class="value">：{{ exportInfo.shiftName }}</div>
    </div>
    <div class="floor">
      <div class="name">施工时间</div>
      <div class="value">
        ：{{ dayjs(exportInfo.startTime).format('YYYY-MM-DD') }}————{{
          dayjs(exportInfo.endTime).format('YYYY-MM-DD')
        }}
      </div>
    </div>

    <div class="floor-1">
      <div class="title">班组统计表格</div>
      <div class="info">
        <el-table
          :border="true"
          :data="exportInfo.tableData"
          class="table"
          stripe
          style="width: 100%"
        >
          <el-table-column label="班组" prop="shiftName"></el-table-column>
          <el-table-column label="施工时长(min)" prop="workDuration" sortable></el-table-column>
          <el-table-column label="班组总产量(m³)" prop="totalProduction" sortable></el-table-column>
          <el-table-column label="总能耗(kW·h)" prop="totalEnergy" sortable></el-table-column>
          <el-table-column
            :formatter="formatSoilTypes"
            label="土质"
            prop="soilTypes"
          ></el-table-column>
        </el-table>
      </div>
    </div>

    <div class="floor-1">
      <div class="title">班组统计信息</div>
      <div class="info">
        <img :src="exportInfo.pieImg" alt="" class="img" />
      </div>
    </div>

    <div class="floor-1 page-break">
      <div class="title">最优班组施工参数</div>
      <div class="info">
        <div v-for="chart in exportInfo.optimalParamImages" :key="chart.title" class="chart-item">
          <div class="sub-title">
            {{ chart.title }}
            <span v-if="chart.time" class="time-display">
              ({{ dayjs(chart.time).format('YYYY-MM-DD HH:mm:ss') }})
            </span>
          </div>
          <img :src="chart.src" alt="" class="img" />
        </div>
      </div>
    </div>
    <div class="floor-1 page-break">
      <div class="title">班组参数与理论值对比</div>
      <div class="info">
        <el-table
          :border="true"
          :data="comparisonTable.rows"
          class="table"
          stripe
          style="width: 100%"
        >
          <el-table-column
            v-for="col in comparisonTable.columns"
            :key="col.prop"
            :label="col.label"
            :prop="col.prop"
            :width="col.width"
          ></el-table-column>
        </el-table>
      </div>
    </div>

    <div v-if="exportInfo.replayChartImages.length > 0" class="floor-1 page-break">
      <div class="title">历史数据回放</div>
      <div class="info">
        <div v-for="chart in exportInfo.replayChartImages" :key="chart.title" class="chart-item">
          <div class="sub-title">{{ chart.title }}</div>
          <img :src="chart.src" alt="" class="img" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-index {
  width: 800px;
  height: 1200px;
  display: flex;
  flex-direction: column;
  padding: 20px 60px;
  page-break-inside: avoid; /* 避免内容内部分页 */
  break-inside: avoid; /* 现代浏览器支持 */
}

.floor {
  display: flex;
  align-items: center;
  padding: 16px 0;
}

.floor .name {
  width: 200px;
  font-weight: bold;
  font-size: 24px;
  text-align: justify;
  text-align-last: justify;
}

.floor .value {
  width: 500px;
  font-weight: bold;
  font-size: 24px;
}

.floor-1 {
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

.floor-1 .title {
  width: 200px;
  font-weight: bold;
  font-size: 24px;
  padding: 16px 0;
  text-align: justify;
  text-align-last: justify;
}

.floor-1 .info {
  width: 800px;
}

.floor-1 .info .img {
  width: 800px;
}

.page-break {
  break-before: page; /* 打印时在此元素前强制分页 */
}

.chart-item {
  margin-bottom: 20px;
  page-break-inside: avoid; /* 避免图表和标题被分页截断 */
}

.sub-title {
  font-size: 20px;
  font-weight: bold;
  padding: 8px 0;
  text-align: center;
}
.sub-title .time-display {
  font-weight: normal;
  font-size: 0.9em;
  color: #333;
  margin-left: 8px;
}
</style>
