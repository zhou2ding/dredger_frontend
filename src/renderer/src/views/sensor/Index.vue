<script setup>
import Title from '../../components/Title.vue' // 假设Title组件的路径
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts' // 引入 ECharts 用于绘制曲线图（即使现在没数据）
import { ElMessage } from 'element-plus' // 引入 Element Plus 消息提示
import 'element-plus/dist/index.css'

// 船名固定显示
const shipName = ref('华安龙(8527船型)')

// 传感器地址
const sensorAddress = ref('') // 默认空

// 传感器连接状态
const isConnecting = ref(false) // 正在尝试连接
const isSensorConnected = ref(false) // 实际连接状态，这里始终为 false

// 假定的传感器数据结构（仅用于定义界面模块，无实际数据）
// 您需要根据实际的传感器通信协议来填充这里的字段和单位
const sensorDataStructure = {
  speed: { value: null, history: [], unit: '节' },
  heading: { value: null, history: [], unit: '°' },
  currentWaterDepth: { value: null, history: [], unit: 'm' },
  cutterDepth: { value: null, history: [], unit: 'm' },
  sPumpRpm: { value: null, history: [], unit: 'rpm' },
  concentration: { value: null, history: [], unit: '%' },
  flow: { value: null, history: [], unit: 'm³/h' },
  horizontalSpeed: { value: null, history: [], unit: 'm/min' },
  carriageTravel: { value: null, history: [], unit: 'm' },
  boosterPumpDischargePressure: { value: null, history: [], unit: 'bar' },
  vacuumDegree: { value: null, history: [], unit: 'kPa' },
  pumpOutletPressure: { value: null, history: [], unit: 'kPa' },
  dieselEngineRPM: { value: null, history: [], unit: 'rpm' },
  mainEnginePower: { value: null, history: [], unit: 'kW' }
}

// 动态创建 chartRefs，用于绑定 ECharts 实例
const chartRefs = {}
for (const key in sensorDataStructure) {
  chartRefs[key] = ref(null)
}
const charts = {} // 存储 ECharts 实例

// 初始化图表 (将显示空图表)
const initChart = (key) => {
  if (chartRefs[key].value) {
    charts[key] = echarts.init(chartRefs[key].value)
    setChartOption(key)
  }
}

// 设置图表选项 (数据为空)
const setChartOption = (key) => {
  const option = {
    grid: {
      left: '10%',
      right: '10%',
      top: '20%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      show: false // 实时数据图不需要显示X轴标签
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: `{value} ${sensorDataStructure[key].unit || ''}` // 显示单位
      }
    },
    series: [
      {
        name: key,
        type: 'line',
        data: sensorDataStructure[key].history, // 这里是空数组
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2
        },
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(128, 255, 165, 0.5)'
            },
            {
              offset: 1,
              color: 'rgba(1, 191, 236, 0.5)'
            }
          ])
        }
      }
    ],
    animation: false
  }
  charts[key].setOption(option)
}

// 模拟连接传感器（始终失败）
const tryConnectSensor = () => {
  if (isConnecting.value) return
  if (!sensorAddress.value) {
    ElMessage.warning('请输入传感器地址！')
    return
  }

  isConnecting.value = true
  isSensorConnected.value = false // 永远为 false

  ElMessage.info(`正在尝试连接传感器: ${sensorAddress.value}...`)

  // 模拟连接超时，始终失败
  setTimeout(() => {
    isConnecting.value = false
    ElMessage.error('连接传感器失败，请检查地址或网络！')
  }, 3000)
}

// 断开连接尝试
const disconnectSensor = () => {
  isConnecting.value = false
  isSensorConnected.value = false
  ElMessage.info('已取消传感器连接尝试。')
}

onMounted(() => {
  // 仅初始化图表骨架，不加载数据
  for (const key in chartRefs) {
    initChart(key)
  }
})

onUnmounted(() => {
  // 清理 ECharts 实例
  for (const key in charts) {
    if (charts[key]) {
      charts[key].dispose()
    }
  }
})

// 映射名称
const displayNames = {
  speed: '航速',
  heading: '船艏向',
  currentWaterDepth: '当前水深',
  cutterDepth: '绞刀深度',
  sPumpRpm: '水下泵转速',
  concentration: '浓度',
  flow: '流量',
  horizontalSpeed: '横移速度',
  carriageTravel: '台车行程',
  boosterPumpDischargePressure: '升压泵排出压力',
  vacuumDegree: '真空度',
  pumpOutletPressure: '泵出口压力',
  dieselEngineRPM: '柴油机转速',
  mainEnginePower: '主机功率'
}
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
          placeholder="请填写传感器地址"
          style="width: 250px; margin-right: 10px"
        ></el-input>
        <el-button v-if="!isConnecting" type="primary" class="connButton" @click="tryConnectSensor">
          连接传感器
        </el-button>
        <el-button v-else type="warning" size="small" @click="disconnectSensor">
          取消连接
        </el-button>
        <span :class="['status-indicator', { connected: isSensorConnected }]"></span>
        <span class="status-text">{{
          isConnecting ? '正在连接...' : isSensorConnected ? '传感器已连接' : '传感器未连接'
        }}</span>
      </div>
    </div>

    <div class="content">
      <div class="data-cards">
        <div v-for="(data, key) in sensorDataStructure" :key="key" class="data-card">
          <div class="card-title">{{ displayNames[key] }}</div>
          <div class="card-value">
            {{ data.value !== null ? data.value : '--' }} <span class="unit">{{ data.unit }}</span>
          </div>
          <div
            :ref="
              (el) => {
                chartRefs[key].value = el
              }
            "
            class="card-chart"
          ></div>
        </div>
      </div>

      <div class="raw-data-table">
        <h3>最新原始数据</h3>
        <el-table
          :data="[]"
          empty-text="等待连接传感器并接收数据..."
          style="width: 100%"
          max-height="250"
        >
          <el-table-column
            v-for="(data, key) in sensorDataStructure"
            :key="key"
            :prop="key"
            :label="`${displayNames[key]}(${data.unit})`"
            min-width="120"
          >
            <template #default="{ row }">
              {{ row[key] !== null ? row[key] : '--' }} {{ data.unit }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.address-tip {
  font-size: 14px;
  color: #909399; /* 灰色提示文字 */
  white-space: nowrap; /* 不换行 */
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #f56c6c; /* 红色表示未连接 */
  flex-shrink: 0;
}

.status-indicator.connected {
  background-color: #67c23a; /* 绿色表示已连接 */
}

.status-text {
  font-size: 16px;
  color: #333;
  flex-shrink: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  display: flex; /* 确保内容居中 */
  justify-content: center;
  align-items: center;
  color: #909399; /* 提示文字颜色 */
  font-size: 14px;
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
  width: 100px;
}
</style>
