<script setup>
import Title from '../../../components/Title.vue'
import { onMounted, ref, watch } from 'vue'
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
  }
})

const CONST = {
  flow: '流量(m³/h）',
  concentration: '浓度(%)',
  sPumpRpm: '水下泵转速(rpm)',
  cutterDepth: '绞刀深度(m)',
  carriageTravel: '台车行程(m)',
  horizontalSpeed: '横移速度(m/min)',
  boosterPumpDischargePressure: '升压泵排出压力(bar)',
  vacuumDegree: '真空度(kPa)'
}

const chartDom = ref(null)

function setOption() {
  const paramKeys = Object.keys(CONST)
  const totalParams = paramKeys.length

  const chartAreaTop = -5
  const chartAreaBottom = 80
  const availableHeight = chartAreaBottom - chartAreaTop

  let option = {
    legend: {
      show: true,
      top: `${chartAreaBottom + 6}%`
    },
    tooltip: {
      formatter: function (value) {
        return `${value.seriesName}：${value.data[0]}`
      }
    },
    grid: [],
    xAxis: [],
    yAxis: [],
    series: []
  }

  paramKeys.forEach((key, index) => {
    const gridTop = chartAreaTop + (index / totalParams) * availableHeight

    option.grid.push({
      left: '17%',
      top: `${gridTop}%`,
      width: '75%',
      height: '10%'
    })

    option.xAxis.push({
      gridIndex: index,
      min: bestParam[key].min,
      max: bestParam[key].max,
      splitNumber: 10,
      axisTick: { length: 6, lineStyle: { width: 2 } },
      axisLine: { lineStyle: { width: 2 } },
      splitLine: { show: false },
      name: CONST[key],
      nameLocation: 'start'
    })

    option.yAxis.push({
      gridIndex: index,
      min: 0,
      max: 1,
      show: false,
      axisLine: { show: false }
    })

    option.series.push({
      name: CONST[key],
      type: 'scatter',
      xAxisIndex: index,
      yAxisIndex: index,
      data: [[bestParam[key].average, 0]],
      markLine: {
        silent: true,
        symbol: '',
        label: {
          show: true,
          position: 'end',
          color: '#0015ff',
          offset: [-20, -5],
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
    })
  })

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
  },
  { deep: true }
)

const exportChartAsImage = () => {
  if (mychart) {
    return mychart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
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
    <div class="title-container">
      <Title title="最优班组施工参数"></Title>
      <slot name="title-right"></slot>
    </div>
    <div v-if="shiftName" class="chart-title">{{ shiftName }}</div>
    <div ref="chartDom" class="chart"></div>
  </div>
</template>

<style scoped>
.best-construction {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.chart {
  width: 100%;
  flex: 1;
}
</style>
