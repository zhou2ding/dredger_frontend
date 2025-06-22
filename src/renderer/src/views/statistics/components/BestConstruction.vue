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
  // 动态计算布局
  const paramKeys = Object.keys(CONST)
  const totalParams = paramKeys.length

  // 定义图表绘制区域的边界
  const chartAreaTop = -5 // 顶部起始位置（百分比）
  const chartAreaBottom = 80 // 底部结束位置（百分比），给图例留出空间
  const availableHeight = chartAreaBottom - chartAreaTop // 可用于绘制坐标轴的总高度

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
    // 初始化空的数组，将在循环中动态填充
    grid: [],
    xAxis: [],
    yAxis: [],
    series: []
  }

  // 使用 forEach 循环，方便获取索引
  paramKeys.forEach((key, index) => {
    // 1. 动态计算每个 grid 的 top 位置
    const gridTop = chartAreaTop + (index / totalParams) * availableHeight

    // 2. 将计算好的 grid 配置推进数组
    option.grid.push({
      left: '17%',
      top: `${gridTop}%`,
      width: '75%',
      height: '10%' // 高度可以统一，因为位置由 top 决定
    })

    // 3. 创建 x 轴配置
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

    // 4. 创建 y 轴配置
    option.yAxis.push({
      gridIndex: index,
      min: 0,
      max: 1,
      show: false,
      axisLine: { show: false }
    })

    // 5. 创建 series 配置
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
          distance: [2, 0],
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

  .chart-title {
    position: absolute;
    top: 20px;
    left: 50%;
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .chart {
    width: 100%;
    flex: 1;
  }
}
</style>
