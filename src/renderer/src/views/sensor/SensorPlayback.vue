<script setup>
import Title from '../../components/Title.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import soilApi from '../../api/search'

// --- 状态管理 ---
const ships = ref([])
const selectedShip = ref('敏龙施工数据')
const isLoading = ref(false)
const sliderValue = ref(0)
const timestamps = ref([])
const MAX_HISTORY_LENGTH = 100

// --- 数据结构 (与后端完全对应) ---
const sensorData = reactive({
  actualVacuum: { value: null, history: [], unit: 'bar' },
  estimatedVacuum: { value: null, history: [], unit: 'bar' },
  flowRate: { value: null, history: [], unit: 'm³/h' },
  concentration: { value: null, history: [], unit: '%' },
  submergedPumpRpm: { value: null, history: [], unit: 'rpm' },
  ladderDepth: { value: null, history: [], unit: 'm' },
  carriageTravel: { value: null, history: [], unit: 'm' },
  transverseSpeed: { value: null, history: [], unit: 'm/min' },
  boosterPumpDischargePressure: { value: null, history: [], unit: 'bar' },
  productionRate: { value: null, history: [], unit: 'm³/h' },
  flowVelocity: { value: null, history: [], unit: 'm/s' },
  density: { value: null, history: [], unit: 't/m³' }
})

const primaryDataKeys = ['actualVacuum', 'estimatedVacuum']
// --- 修正: 更新次要显示区域的key, 按顺序排列 ---
const secondaryDataKeys = [
  'flowRate',
  'concentration',
  'submergedPumpRpm',
  'ladderDepth',
  'carriageTravel',
  'transverseSpeed',
  'boosterPumpDischargePressure',
  'productionRate',
  'flowVelocity',
  'density'
]

// --- 修正: 更新显示名称映射 ---
const displayNames = {
  actualVacuum: '实际真空度',
  estimatedVacuum: '预估真空度',
  flowRate: '流量',
  concentration: '浓度',
  submergedPumpRpm: '水下泵转速',
  ladderDepth: '绞刀深度',
  carriageTravel: '台车行程',
  transverseSpeed: '横移速度',
  boosterPumpDischargePressure: '升压泵排出压力',
  productionRate: '小时产量率',
  flowVelocity: '流速',
  density: '密度'
}

// --- ECharts (无变化) ---
const chartRefs = ref({})
const charts = {}
const initChart = (key) => {
  const chartDom = chartRefs.value[key]
  if (chartDom && !charts[key]) {
    charts[key] = echarts.init(chartDom)
    setChartOption(key, [])
  }
}
const setChartOption = (key, data) => {
  if (!charts[key]) return
  const isPrimary = primaryDataKeys.includes(key)
  const option = {
    grid: { left: isPrimary ? '12%' : '18%', right: '5%', top: '15%', bottom: '15%' },
    xAxis: { type: 'category', show: false },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: `{value}`, fontSize: isPrimary ? 14 : 10 },
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [
      { name: key, type: 'line', data, smooth: true, showSymbol: false, lineStyle: { width: 2 } }
    ],
    animation: false
  }
  charts[key].setOption(option, true)
}

// --- 数据获取与处理 (无变化) ---
const fetchShipList = async () => {
  try {
    const res = await soilApi.getShipList()
    if (res.data) {
      ships.value = res.data
      if (!ships.value.includes(selectedShip.value)) {
        selectedShip.value = ships.value[0] || ''
      }
    }
  } catch (error) {
    ElMessage.error('获取船只列表失败！')
    console.error(error)
  }
}
const fetchPlaybackData = async () => {
  if (!selectedShip.value) return
  isLoading.value = true
  ElMessage.info(`正在加载 ${selectedShip.value} 的历史数据...`)
  try {
    const res = await soilApi.getPlaybackData({ shipName: selectedShip.value })
    const data = res.data
    if (!data || !data.timestamps || data.timestamps.length === 0) {
      ElMessage.warning('该船只没有可回放的历史数据。')
      timestamps.value = []
      for (const key in sensorData) {
        sensorData[key].history = []
      }
      sliderValue.value = 0
      updateDisplayData(0)
      return
    }
    timestamps.value = data.timestamps
    for (const key in sensorData) {
      if (data[key]) {
        sensorData[key].history = data[key]
      } else {
        sensorData[key].history = new Array(data.timestamps.length).fill(null)
      }
    }
    sliderValue.value = 0
    updateDisplayData(0)
    ElMessage.success('数据加载完成！')
  } catch (error) {
    ElMessage.error('加载历史数据失败！')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
const updateDisplayData = (index) => {
  if (timestamps.value.length === 0) {
    for (const key in sensorData) {
      sensorData[key].value = null
      if (charts[key]) setChartOption(key, [])
    }
    return
  }
  for (const key in sensorData) {
    const history = sensorData[key].history
    if (history && history.length > index) {
      const newValue = history[index]
      sensorData[key].value = newValue !== null ? parseFloat(newValue.toFixed(2)) : null
      if (charts[key]) {
        const start = Math.max(0, index - MAX_HISTORY_LENGTH + 1)
        const chartData = history.slice(start, index + 1)
        setChartOption(key, chartData)
      }
    }
  }
}

// --- 生命周期与侦听器 (无变化) ---
onMounted(async () => {
  for (const key in sensorData) {
    initChart(key)
  }
  await fetchShipList()
})
watch(selectedShip, () => {
  fetchPlaybackData()
})
watch(sliderValue, (newIndex) => {
  updateDisplayData(newIndex)
})
const sliderTooltipFormat = (val) => {
  if (timestamps.value.length > val) {
    const ts = timestamps.value[val]
    return new Date(ts).toLocaleString()
  }
  return ''
}
const currentTimeDisplay = computed(() => {
  if (timestamps.value.length > sliderValue.value) {
    return new Date(timestamps.value[sliderValue.value]).toLocaleString()
  }
  return 'N/A'
})
</script>

<template>
  <div class="sensor-playback">
    <div class="header">
      <Title title="传感器历史数据回放"></Title>
      <div class="ship-control">
        <span>当前船只: </span>
        <el-select
          v-model="selectedShip"
          placeholder="请选择船只"
          style="width: 250px; margin-left: 10px"
        >
          <el-option v-for="ship in ships" :key="ship" :label="ship" :value="ship"></el-option>
        </el-select>
      </div>
    </div>

    <div v-loading="isLoading" class="content">
      <div class="primary-data-cards">
        <div v-for="key in primaryDataKeys" :key="key" class="data-card primary">
          <div class="card-title">{{ displayNames[key] }}</div>
          <div class="card-value">
            {{ sensorData[key].value !== null ? sensorData[key].value : '--' }}
            <span class="unit">{{ sensorData[key].unit }}</span>
          </div>
          <div
            :ref="
              (el) => {
                if (el) chartRefs[key] = el
              }
            "
            class="card-chart"
          ></div>
        </div>
      </div>

      <div class="secondary-data-cards">
        <div v-for="key in secondaryDataKeys" :key="key" class="data-card secondary">
          <div class="card-title">{{ displayNames[key] }}</div>
          <div class="card-value">
            {{ sensorData[key].value !== null ? sensorData[key].value : '--' }}
            <span class="unit">{{ sensorData[key].unit }}</span>
          </div>
          <div
            :ref="
              (el) => {
                if (el) chartRefs[key] = el
              }
            "
            class="card-chart"
          ></div>
        </div>
      </div>
    </div>

    <div class="footer-timeline">
      <div class="current-time">当前时间: {{ currentTimeDisplay }}</div>
      <el-slider
        v-model="sliderValue"
        :disabled="isLoading || timestamps.length === 0"
        :format-tooltip="sliderTooltipFormat"
        :max="timestamps.length > 0 ? timestamps.length - 1 : 0"
        :min="0"
        :step="1"
        style="width: 90%; margin: 0 auto"
      />
    </div>
  </div>
</template>

<style scoped>
.sensor-playback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.ship-control {
  font-size: 16px;
  color: #333;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}
.primary-data-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

/* --- 修正: 修改布局为5列 --- */
.secondary-data-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 固定为5列 */
  gap: 20px;
}

.data-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.data-card.primary {
  padding: 25px;
}
.data-card.primary .card-title {
  font-size: 22px;
}
.data-card.primary .card-value {
  font-size: 48px;
}
.data-card.primary .card-chart {
  height: 180px;
}
.data-card.secondary .card-title {
  font-size: 16px;
}
.data-card.secondary .card-value {
  font-size: 28px;
}
.data-card.secondary .card-chart {
  height: 120px;
}
.card-title {
  font-weight: bold;
  color: #304156;
  margin-bottom: 10px;
}
.card-value {
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
  display: flex;
  align-items: baseline;
}
.unit {
  font-size: 16px;
  margin-left: 5px;
  color: #606266;
}
.card-chart {
  width: 100%;
}
.footer-timeline {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  border-top: 1px solid #ebeef5;
}
.current-time {
  text-align: center;
  font-size: 16px;
  color: #303133;
  margin-bottom: 10px;
}
</style>
