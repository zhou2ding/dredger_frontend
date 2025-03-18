<script setup>
import Title from '../../../components/Title.vue'
import * as echarts from 'echarts'
import { ref, onMounted, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

// eslint-disable-next-line vue/require-prop-types
const dataType = defineModel()

const chartDom = ref(null)
const { time, shiftsStaticData } = defineProps({
  time: {
    type: Number,
    default: 1
  },
  shiftsStaticData: {
    type: Array,
    default: () => []
  }
})

const titleList = ['', '施工时长', '班组总产量', '总能耗']
const keyList = {
  1: 'workDuration',
  2: 'totalProduction',
  3: 'totalEnergy'
}
let mychart

function setOption() {
  let obj = {
    title: {
      text: titleList[dataType.value],
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'center'
    },
    series: []
  }
  let seriesObj = {
    type: 'pie',
    radius: '78%',
    data: [],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }
  shiftsStaticData.forEach((item) => {
    seriesObj.data.push({ value: item[keyList[dataType.value]], name: item.shiftName })
  })
  let copyObj = JSON.parse(JSON.stringify(seriesObj))
  copyObj.label = {
    show: true, //饼图上的数据是否展示true展示false不展示
    position: 'inner', //饼图上的数据展示位置inner是展示在内部
    formatter: '{d}%' //饼图上展示的数据格式
  }
  obj.series.push(seriesObj)
  obj.series.push(copyObj)
  return obj
}

onMounted(() => {
  mychart = echarts.init(chartDom.value)
  mychart.setOption(setOption())
})
watch(
  () => time,
  () => {
    mychart.setOption(setOption())
  }
)

function resetChart() {
  mychart.resize()
}

useResizeObserver(chartDom, resetChart)

const emit = defineEmits(['updateDateType'])

function changeData() {
  emit('updateDateType')
  mychart.setOption(setOption())
}

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
  <div class="statistics-time">
    <Title title="班组时间统计"></Title>
    <div class="change-data">
      <el-radio-group v-model="dataType" @change="changeData">
        <el-radio :value="1">施工时长</el-radio>
        <el-radio :value="2">班组总产量</el-radio>
        <el-radio :value="3">单方能耗</el-radio>
      </el-radio-group>
    </div>
    <div ref="chartDom" class="chart"></div>
  </div>
</template>

<style scoped>
.statistics-time {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .chart {
    width: 100%;
    flex: 1;
  }

  .change-data {
    position: absolute;
    top: 40px;
    left: 20px;
    z-index: 100;

    .el-radio-group {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .el-radio {
        .el-radio__label {
          font-size: 18px;
        }
      }
    }
  }
}
</style>
