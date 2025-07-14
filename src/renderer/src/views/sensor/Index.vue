<script setup>
import Title from '../../components/Title.vue'
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

// --- State Management ---
const shipName = ref('华安龙(8527船型)')
const sensorAddress = ref('')
const isConnecting = ref(false)
const isSensorConnected = ref(false)
let websocket = null

// --- Data Structure (保持UI结构，为未来做准备) ---
const sensorData = reactive({
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

// 显示名称映射
const displayNames = {
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
  const option = {
    grid: { left: '15%', right: '5%', top: '20%', bottom: '15%' },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', axisLabel: { formatter: `{value} ${sensorData[key].unit || ''}` } },
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
  charts[key].setOption(option)
}

// --- Connection Logic ---
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
    // 重要：将用户填写的地址发送给后端
    websocket.send(sensorAddress.value)
  }

  // 后端在当前阶段不会主动发消息，但可以接收一次性的连接结果消息
  websocket.onmessage = (event) => {
    const message = event.data
    if (message.startsWith('Error:')) {
      isConnecting.value = false
      isSensorConnected.value = false
      ElMessage.error(`连接传感器失败: ${message.replace('Error: ', '')}`)
      websocket.close()
    } else {
      isConnecting.value = false
      isSensorConnected.value = true
      ElMessage.success(message)
    }
  }

  websocket.onclose = () => {
    isConnecting.value = false
    isSensorConnected.value = false
    websocket = null
    if (isSensorConnected.value) {
      // 只有在曾经成功连接过的情况下才提示
      ElMessage.info('连接已断开。')
    }
  }

  websocket.onerror = (error) => {
    isConnecting.value = false
    isSensorConnected.value = false
    websocket = null
    console.error('Connection Error:', error)
    ElMessage.error('连接后端服务失败，请检查服务是否开启！')
  }
}

const disconnectSensor = () => {
  if (websocket) {
    websocket.close()
  }
}

// --- Lifecycle Hooks ---
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
      <div class="data-cards">
        <div v-for="(data, key) in sensorData" :key="key" class="data-card">
          <div class="card-title">{{ displayNames[key] }}</div>
          <div class="card-value">
            {{ data.value !== null ? data.value : '--' }} <span class="unit">{{ data.unit }}</span>
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

      <div class="raw-data-table">
        <h3>最新原始数据</h3>
        <el-table
          :data="[sensorData]"
          style="width: 100%"
          max-height="350"
          stripe
          border
          empty-text="等待连接并接收数据..."
        >
          <el-table-column
            v-for="(data, key) in sensorData"
            :key="key"
            :prop="key"
            :label="`${displayNames[key]} (${data.unit})`"
            min-width="180"
            align="center"
          >
            <template #default="{ row }">
              <span style="font-weight: bold; color: #409eff">
                {{ row[key].value !== null ? row[key].value : '--' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式与原文件相同，此处省略 */
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
  display: flex;
  align-items: center;
}

.ship-name {
  font-weight: bold;
  color: #409eff;
}

.sensor-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #f56c6c;
  flex-shrink: 0;
}

.status-indicator.connected {
  background-color: #67c23a;
}

.status-text {
  font-size: 16px;
  color: #333;
  flex-shrink: 0;
}

.content {
  flex: 1;
  overflow-y: auto;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.data-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #304156;
  margin-bottom: 10px;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 15px;
  display: flex;
  align-items: baseline;
}

.card-value .unit {
  font-size: 18px;
  margin-left: 5px;
  color: #606266;
}

.card-chart {
  width: 100%;
  height: 150px;
}

.raw-data-table {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-top: 20px;
}

.raw-data-table h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #304156;
  font-size: 20px;
}

.connButton {
  width: 120px;
}
</style>
