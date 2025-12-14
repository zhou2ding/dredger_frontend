<script setup>
import Title from '../../../components/Title.vue'
import { computed, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useResizeObserver } from '@vueuse/core'
import dayjs from 'dayjs'
import { InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  shiftName: {
    type: String,
    default: ''
  },
  optimalTime: {
    type: Number,
    default: 0
  },
  bestParam: {
    type: Object,
    default: () => ({}) // 简化默认值，依靠内部防御逻辑
  },
  shipName: {
    type: String,
    default: ''
  }
})

const isHuaAnLong = computed(() => props.shipName.includes('华安龙'))

const CONST = computed(() => {
  if (isHuaAnLong.value) {
    return {
      flow: '流量(m³/h)',
      concentration: '浓度(%)',
      sPumpRpm: '水下泵转速(rpm)',
      cutterDepth: '绞刀深度(m)',
      horizontalSpeed: '横移速度(m/min)',
      mudPump2DischargePressure: '2#泥泵排出压力(bar)',
      boosterPumpDischargePressure: '水下泵排出压力(bar)',
      vacuumDegree: '真空度(kPa)'
    }
  }

  return {
    flow: '流量(m³/h)',
    concentration: '浓度(%)',
    sPumpRpm: '水下泵转速(rpm)',
    cutterDepth: '绞刀深度(m)',
    carriageTravel: '台车行程(m)',
    horizontalSpeed: '横移速度(m/min)',
    boosterPumpDischargePressure: '升压泵排出压力(bar)',
    vacuumDegree: '真空度(kPa)'
  }
})

const formattedOptimalTime = computed(() => {
  if (!props.optimalTime) {
    return ''
  }
  return dayjs(props.optimalTime).format('YYYY-MM-DD HH:mm:ss')
})

const chartDom = ref(null)

function setOption() {
  const paramKeys = Object.keys(CONST.value)
  const totalParams = paramKeys.length

  // 【修正 1】将 Top 改为正数，避免布局计算异常
  const chartAreaTop = 5
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

    // 【修正 2：核心修复】增加防御性判断
    // 如果 props.bestParam 中没有 key 对应的数据，使用默认全0数据防止崩溃
    const rawData = props.bestParam && props.bestParam[key]
    const paramData = rawData || {
      min: 0,
      max: 10,
      average: 0,
      variance: 0
    }

    option.xAxis.push({
      gridIndex: index,
      min: paramData.min,
      max: paramData.max,
      splitNumber: 10,
      axisTick: { length: 6, lineStyle: { width: 2 } },
      axisLine: { lineStyle: { width: 2 } },
      splitLine: { show: false },
      name: CONST.value[key],
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
      name: CONST.value[key],
      type: 'scatter',
      xAxisIndex: index,
      yAxisIndex: index,
      data: [[paramData.average, 0]],
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
            name: Number((paramData.variance || 0).toFixed(3)), // 防止 variance 为 undefined
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
  // 初始化时也需要判断数据是否存在
  if (props.bestParam) {
    mychart.setOption(setOption())
  }
})

function resetChart() {
  if (mychart) {
    mychart.resize()
  }
}

useResizeObserver(chartDom, resetChart)

watch(
  () => props.bestParam,
  () => {
    if (mychart) {
      // 加上 try-catch 防止数据异常导致整个页面卡死
      try {
        mychart.setOption(setOption(), true) // 第二个参数 true 表示不合并，重绘，防止旧数据残留
      } catch (e) {
        console.error('图表渲染失败', e)
      }
    }
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
      <div class="title-with-tip">
        <Title title="最优班组施工参数" />
        <el-tooltip content="右侧蓝色数值表示方差" effect="dark" placement="right">
          <el-icon class="tip-icon">
            <InfoFilled />
          </el-icon>
        </el-tooltip>
      </div>
      <slot v-if="props.shipName.includes('敏龙')" name="title-right"></slot>
    </div>

    <div v-if="props.shiftName" class="chart-title">
      {{ props.shiftName }}
      <span v-if="formattedOptimalTime" class="time-display"> ({{ formattedOptimalTime }}) </span>
    </div>

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
.time-display {
  font-weight: normal;
  font-size: 0.9em;
  color: #666;
  margin-left: 8px;
}
.title-with-tip {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tip-icon {
  font-size: 16px;
  color: #999;
  cursor: pointer;
}

.tip-icon:hover {
  color: #409eff;
}
</style>
