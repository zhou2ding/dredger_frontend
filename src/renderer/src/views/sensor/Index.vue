<script setup>
import Title from '../../components/Title.vue'
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

// --- 状态管理 ---
const shipName = ref('华安龙(8527船型)')
const sensorAddress = ref('127.0.0.1:4001') // 默认填入协议端口
const isConnecting = ref(false)
const isSensorConnected = ref(false)
let websocket = null
const MAX_HISTORY_LENGTH = 100 // 定义图表历史数据最大长度

// --- 数据结构 ---
// 新增 actualVacuum 和 estimatedVacuum
const sensorData = reactive({
  actualVacuum: { value: null, history: [], unit: 'kPa' },
  estimatedVacuum: { value: null, history: [], unit: 'kPa' },
  flowRate: { value: null, history: [], unit: 'm³/h' },
  concentration: { value: null, history: [], unit: '%' },
  productionRate: { value: null, history: [], unit: 'm³/h' },
  ladderDepth: { value: null, history: [], unit: 'm' },
  cutterRpm: { value: null, history: [], unit: 'rpm' },
  submergedPumpRpm: { value: null, history: [], unit: 'rpm' },
  mudPump1Rpm: { value: null, history: [], unit: 'rpm' },
  mudPump2Rpm: { value: null, history: [], unit: 'rpm' },
  submergedPumpDischarge: { value: null, history: [], unit: 'kPa' },
  mudPump1Discharge: { value: null, history: [], unit: 'kPa' },
  mudPump2Discharge: { value: null, history: [], unit: 'kPa' },
  gpsSpeed: { value: null, history: [], unit: '节' }
})

// 分离第一排和第二排的数据键
const primaryDataKeys = ['actualVacuum', 'estimatedVacuum']
const secondaryDataKeys = Object.keys(sensorData).filter((key) => !primaryDataKeys.includes(key))

// 显示名称映射
const displayNames = {
  actualVacuum: '实际真空度',
  estimatedVacuum: '预估真空度',
  flowRate: '流量',
  concentration: '浓度',
  productionRate: '小时产量',
  ladderDepth: '桥架深度',
  cutterRpm: '绞刀转速',
  submergedPumpRpm: '水下泵转速',
  mudPump1Rpm: '1#泥泵转速',
  mudPump2Rpm: '2#泥泵转速',
  submergedPumpDischarge: '水下泵排出压力',
  mudPump1Discharge: '1#泥泵排出压力',
  mudPump2Discharge: '2#泥泵排出压力',
  gpsSpeed: '航速'
}

// --- ECharts ---
const chartRefs = ref({})
const charts = {}

const initChart = (key) => {
  const chartDom = chartRefs.value[key]
  if (chartDom && !charts[key]) {
    charts[key] = echarts.init(chartDom)
    setChartOption(key)
  }
}

const setChartOption = (key) => {
  if (!charts[key]) return
  const isPrimary = primaryDataKeys.includes(key)
  const option = {
    grid: {
      left: isPrimary ? '12%' : '18%',
      right: '5%',
      top: '15%',
      bottom: '15%'
    },
    xAxis: { type: 'category', show: false },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: `{value}`,
        fontSize: isPrimary ? 14 : 10
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: key,
        type: 'line',
        data: sensorData[key].history,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 }
      }
    ],
    animation: false
  }
  charts[key].setOption(option, true) // 使用 notMerge: true 确保配置干净
}

// --- 连接逻辑 ---
const connectSensor = () => {
  if (isConnecting.value || isSensorConnected.value) return
  if (!sensorAddress.value) {
    ElMessage.warning('请输入传感器地址！')
    return
  }

  const wsURL = `ws://127.0.0.1:12580/v1/ws/sensor`
  websocket = new WebSocket(wsURL)
  isConnecting.value = true
  ElMessage.info(`正在连接传感器...`)

  websocket.onopen = () => {
    // 将用户填写的地址发送给后端，由后端去建立TCP连接
    websocket.send(sensorAddress.value)
  }

  // 修改 onmessage 以处理持续的数据流
  websocket.onmessage = (event) => {
    const message = event.data

    // 首次连接成功的消息处理
    if (message === '传感器连接成功' && !isSensorConnected.value) {
      isConnecting.value = false
      isSensorConnected.value = true
      ElMessage.success(message)
      return
    }

    // 连接失败的消息处理
    if (message.startsWith('Error:')) {
      isConnecting.value = false
      isSensorConnected.value = false
      ElMessage.error(`连接传感器失败: ${message.replace('Error: ', '')}`)
      websocket.close()
      return
    }

    // 接收并处理传感器数据
    try {
      const data = JSON.parse(message)
      // 遍历接收到的数据，更新UI
      for (const key in data) {
        if (sensorData[key]) {
          const newValue = parseFloat(data[key].toFixed(2)) // 保留两位小数
          sensorData[key].value = newValue

          // 更新历史数据
          sensorData[key].history.push(newValue)
          if (sensorData[key].history.length > MAX_HISTORY_LENGTH) {
            sensorData[key].history.shift() // 移除最老的数据
          }

          // 更新图表
          if (charts[key]) {
            setChartOption(key)
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse sensor data:', error)
    }
  }

  websocket.onclose = () => {
    if (isSensorConnected.value) {
      ElMessage.info('与服务器的连接已断开。')
    }
    isConnecting.value = false
    isSensorConnected.value = false
    websocket = null
  }

  websocket.onerror = (error) => {
    if (!isSensorConnected.value) {
      ElMessage.error('连接后端服务失败，请检查服务是否开启！')
    }
    isConnecting.value = false
    isSensorConnected.value = false
    websocket = null
    console.error('Connection Error:', error)
  }
}

const disconnectSensor = () => {
  if (websocket) {
    websocket.close()
  }
}

// --- 生命周期钩子 ---
onMounted(() => {
  nextTick(() => {
    for (const key in sensorData) {
      initChart(key)
    }
  })
})

onUnmounted(() => {
  disconnectSensor()
  for (const key in charts) {
    if (charts[key]) {
      charts[key].dispose()
    }
  }
})
</script>

<template>
  <div class="sensor-index">
    <div class="header">
      <Title title="传感器实时数据"></Title>
      <div class="ship-info">
        <span>当前船只: </span>
        <span class="ship-name">{{ shipName }}</span>
      </div>
      <div class="sensor-control">
        <el-input
          v-model="sensorAddress"
          placeholder="请输入传感器地址"
          style="width: 250px; margin-right: 10px"
          :disabled="isConnecting || isSensorConnected"
        ></el-input>
        <el-button
          v-if="!isSensorConnected"
          type="primary"
          class="connButton"
          :loading="isConnecting"
          @click="connectSensor"
        >
          {{ isConnecting ? '连接中...' : '连接' }}
        </el-button>
        <el-button v-else type="danger" size="small" @click="disconnectSensor">
          断开连接
        </el-button>
        <span :class="['status-indicator', { connected: isSensorConnected }]"></span>
        <span class="status-text">{{
          isConnecting ? '正在连接...' : isSensorConnected ? '已连接' : '未连接'
        }}</span>
      </div>
    </div>

    <div class="content">
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
  </div>
</template>

<style scoped>
/* 样式与原文件相同，此处省略，但为完整性添加一些关键调整 */
.sensor-index {
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

.ship-info {
  font-size: 16px;
  color: #333;
  margin-right: 20px;
}

.ship-name {
  font-weight: bold;
  color: #409eff;
}

.sensor-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.status-indicator.connected {
  background-color: #67c23a;
}

.status-text {
  font-size: 16px;
  color: #333;
}

.content {
  flex: 1;
  overflow-y: auto;
}

/* 新增的布局容器 */
.primary-data-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 一行两列 */
  gap: 20px;
  margin-bottom: 20px;
}

.secondary-data-cards {
  display: grid;
  /* 适配不同屏幕宽度，每行最少2个，最多6个 */
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.data-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 主要数据显示卡片样式 */
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

/* 次要数据显示卡片样式 */
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

.connButton {
  width: 120px;
}
</style>
