<script setup>
import { ref, nextTick, computed, onMounted, onUnmounted } from 'vue'
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
  scatterImg: '',
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

  // 1. 定义表格的列
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

  // 2. 定义参数行和单位 (key 对应后端 ParameterStats 结构体的字段名)
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

  // 3. 构造表格行数据
  const rows = Object.keys(paramKeys).map((key) => {
    const [name, unit] = paramKeys[key].split(' (')
    const rowData = {
      paramName: name,
      unit: unit ? `(${unit}` : '',
      // 从理论值中取值
      theoretical: data.theory ? data.theory[key] : 'N/A'
    }
    // 从每个班组的实际值中取值 (我们这里对比的是平均值 Average)
    data.shifts.forEach((shift) => {
      rowData[shift.shiftName] = shift.parameters[key]?.average ?? 'N/A'
    })
    return rowData
  })

  return { columns, rows }
})
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
          :data="exportInfo.tableData"
          :border="true"
          stripe
          style="width: 100%"
          class="table"
        >
          <el-table-column label="班组" prop="shiftName"></el-table-column>
          <el-table-column sortable label="施工时长(min)" prop="workDuration"></el-table-column>
          <el-table-column sortable label="班组总产量(m³)" prop="totalProduction"></el-table-column>
          <el-table-column sortable label="总能耗(kW·h)" prop="totalEnergy"></el-table-column>
        </el-table>
      </div>
    </div>

    <div class="floor-1">
      <div class="title">班组统计信息</div>
      <div class="info">
        <img class="img" :src="exportInfo.pieImg" alt="" />
      </div>
    </div>

    <div class="floor-1">
      <div class="title">最优班组施工参数</div>
      <div class="info">
        <img class="img" :src="exportInfo.scatterImg" alt="" />
      </div>
    </div>

    <div class="floor-1 page-break">
      <div class="title">班组参数与理论值对比</div>
      <div class="info">
        <el-table
          :data="comparisonTable.rows"
          :border="true"
          stripe
          style="width: 100%"
          class="table"
        >
          <el-table-column
            v-for="col in comparisonTable.columns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
          ></el-table-column>
        </el-table>
      </div>
    </div>

    <div class="floor-1 page-break" v-if="exportInfo.replayChartImages.length > 0">
      <div class="title">历史数据回放</div>
      <div class="info">
        <div v-for="chart in exportInfo.replayChartImages" :key="chart.title" class="chart-item">
          <div class="sub-title">{{ chart.title }}</div>
          <img class="img" :src="chart.src" alt="" />
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

/* [新增] 样式 */
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
</style>
