<script setup>
import Title from '../../../components/Title.vue'
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useResizeObserver } from '@vueuse/core'

const { bestParam, shiftName } = defineProps({
  shiftName: {
    type: String,
    default: ''
  },
  bestParam: {
    type: Object,
    default: () => {
      return {
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
        }
      }
    }
  }
})

const CONST = {
  flow: '流量(m³/h）',
  concentration: '浓度(%)',
  sPumpRpm: '水下泵转速(rpm)',
  cutterDepth: '绞刀深度(m)',
  carriageTravel: '台车行程(m)',
  horizontalSpeed: '横移速度(m/min)'
}

const chartDom = ref(null)

function setOption() {
  let option = {
    title: {
      text: shiftName,
      left: 'center',
      top: '2%'
    },
    legend: {
      show: true,
      top: '84%'
    },
    grid: [
      { left: '17%', top: '6%', width: '75%', height: '68%' },
      { left: '17%', top: '6%', width: '75%', height: '56%' },
      { left: '17%', top: '6%', width: '75%', height: '44%' },
      { left: '17%', top: '6%', width: '75%', height: '32%' },
      { left: '17%', top: '6%', width: '75%', height: '20%' },
      { left: '17%', top: '6%', width: '75%', height: '8%' }
    ],
    tooltip: {
      formatter: '{a}: ({c})'
    },
    xAxis: [],
    yAxis: [],
    series: []
  }
  let index = 0
  let dataAll = []
  for (let key in CONST) {
    let objx = {
      gridIndex: index,
      min: bestParam[key].min,
      max: bestParam[key].max,
      splitNumber: 10,
      axisTick: { length: 6, lineStyle: { width: 2 } },
      axisLine: { lineStyle: { width: 2 } },
      splitLine: { show: false },
      name: CONST[key],
      nameLocation: 'start'
    }
    dataAll.push([[bestParam[key].maxProductionParam, 0]])
    let objy = { gridIndex: index, min: 0, max: 1, show: false, axisLine: { show: false } }
    option.xAxis.push(objx)
    option.yAxis.push(objy)
    let seriesObj = {
      name: CONST[key],
      type: 'scatter',
      xAxisIndex: index,
      yAxisIndex: index,
      data: dataAll[index],
      markLine: {
        silent: true,
        symbol: '',
        label: {
          show: true,
          position: 'end',
          color: '#0015ff',
          distance: [10, 0],
          formatter: (param) => {
            return param.name
          }
        },
        lineStyle: {
          color: '#333333',
          width: 2,
          type: 'solid'
        },
        data: [
          {
            name: Number(bestParam[key].variance.toFixed(3)),
            yAxis: 0
          }
        ]
      }
    }
    option.series.push(seriesObj)
    index++
  }
  return option
}

let mychart
onMounted(() => {
  mychart = echarts.init(chartDom.value)
  mychart.setOption(setOption())
})

function resetChart() {
  mychart.resize()
}

useResizeObserver(chartDom, resetChart)
watch(
  () => bestParam,
  () => {
    mychart.setOption(setOption())
  }
)

// 导出图表为图片
const exportChartAsImage = () => {
  if (mychart) {
    return mychart.getDataURL({
      type: 'png', // 可以是 'png' 或 'jpeg'
      pixelRatio: 2, // 设置图像的像素比例
      backgroundColor: '#fff' // 背景颜色
    })
  }
  return null
}
defineExpose({
  exportChartAsImage
})
</script>

<template>
  <div class="best-construction">
    <Title title="最优班组施工参数"></Title>
    <div ref="chartDom" class="chart"></div>
  </div>
</template>

<style scoped>
.best-construction {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .chart {
    width: 100%;
    flex: 1;
  }
}
</style>
