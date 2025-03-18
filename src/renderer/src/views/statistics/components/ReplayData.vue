<script setup>
import Title from '../../../components/Title.vue'
import * as echarts from 'echarts'
import { ref, onMounted, watch } from 'vue'
import searchApi from '../../../api/search/index'
import { useResizeObserver } from '@vueuse/core'
import { dayjs } from "element-plus";

const chartDom = ref(null)

const column = ref('')
const columnName = ref('')
const columnUnit = ref('')//所选列单位名

const { searchCondition, time, columnList } = defineProps({
  searchCondition: {
    type: Object,
    default: () => {
      return {
        startDate: 0,
        endDate: 0,
        shipName: ''
      }
    }
  },
  time: {
    type: Number,
    default: 1
  },
  columnList: {
    type: Array,
    default: () => []
  }
})

function setOption(data = []) {
  let option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [columnName.value]
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '6%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel:{
        formatter: function () {
          return '{yyyy}-{MM}-{dd}'+'\n'+'{HH}:{mm}:{ss}'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    yAxis: {
      type: 'value',
      name:'单位：'+columnUnit.value,
      nameTextStyle: {
        color: "#333333",
        nameLocation: "start",
      },
      axisLine: {
        show: true
      }
    },
    series: [
      {
        name: columnName.value,
        type: 'line',
        data: data,
        smooth: true,
        //开启大数据量优化，在数据特别多而出现图形卡顿时候开启
        large: true,
        largeThreshold: 10000,
        sampling: 'average'
      }
    ]
  }
  return option
}

let mychart
watch(
  () => time,
  () => {
    if (columnList.length > 0) {
      column.value = columnList[0].columnName
      changeColumn(columnList[0].columnName)
    }
  }
)

onMounted(() => {
  mychart = echarts.init(chartDom.value)
  mychart.setOption(setOption())
})

function resetChart() {
  mychart.resize()
}

useResizeObserver(chartDom, resetChart)

function changeColumn(column) {
  let index = columnList.findIndex((item) => item.columnName === column)
  if (index > -1) {
    columnName.value = columnList[index].columnChineseName
    columnUnit.value = columnList[index].columnUnit
  }
  searchApi.getReplayData(column, searchCondition).then((res) => {
    let data = res.data ?? []
    let list = []
    data.forEach((item) => {
      list.push([item.timestamp, item.value])
    })
    mychart.setOption(setOption(list))
  })
}
</script>

<template>
  <div class="replay-data">
    <Title title="历史数据回放"></Title>
    <div class="data-type">
      <el-select v-model="column" @change="changeColumn">
        <el-option
          v-for="item in columnList"
          :key="item.columnName"
          :value="item.columnName"
          :label="item.columnChineseName"
        ></el-option>
      </el-select>
    </div>
    <div ref="chartDom" class="chart"></div>
  </div>
</template>

<style scoped>
.replay-data {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .chart {
    width: 100%;
    flex: 1;
  }

  .data-type {
    position: absolute;
    width: 160px;
    z-index: 100;
    top: 0px;
    left: 160px;
  }
}
</style>
