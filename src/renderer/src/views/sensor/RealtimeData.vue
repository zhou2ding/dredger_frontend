<script setup>
import Title from '../../components/Title.vue'
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

// --- 状态管理 ---
const shipName = ref('华安龙(8527船型)')
// 后端服务地址, 这是固定的
const BACKEND_WS_URL = 'ws://localhost:12580/v1/ws/sensor'
const sensorAddress = ref('127.0.0.1:4001') // 默认填入协议端口
const isConnecting = ref(false)
const isSensorConnected = ref(false)
let websocket = null
const MAX_HISTORY_LENGTH = 100

// --- 数据结构 ---
// 严格按照后端 main.go -> SensorData 结构体（JSON标签）进行定义
// 并且为需要绘图的字段添加 history 数组
const sensorData = reactive({
  predictedVacuum: { value: null, history: [], unit: 'kPa', label: '预估真空度' },
  underwater_pump_suction_vacuum: { value: null, history: [], unit: 'bar', label: '实际真空度' },
  // ... 其他所有字段 ...
  flow_rate: { value: null, unit: 'm³/h', label: '流量' },
  concentration: { value: null, unit: '%', label: '浓度' },
  hourly_output_rate: { value: null, unit: 'm³/h', label: '小时产量率' },
  bridge_depth: { value: null, unit: 'm', label: '桥架深度' },
  cutter_speed: { value: null, unit: 'rpm', label: '绞刀转速' },
  underwater_pump_speed: { value: null, unit: 'rpm', label: '水下泵转速' },
  mud_pump_1_speed: { value: null, unit: 'rpm', label: '泥泵1#转速' },
  mud_pump_2_speed: { value: null, unit: 'rpm', label: '泥泵2#转速' },
  left_ear_draft: { value: null, unit: 'm', label: '左耳轴吃水' },
  underwater_pump_suction_seal_pressure: {
    value: null,
    unit: 'bar',
    label: '水下泵吸入端封水压力'
  },
  underwater_pump_shaft_seal_pressure: { value: null, unit: 'bar', label: '水下泵轴端封水压力' },
  mud_pump_1_shaft_seal_pressure: { value: null, unit: 'bar', label: '1#泥泵轴端封水压力' },
  mud_pump_1_suction_seal_pressure: { value: null, unit: 'bar', label: '1#泥泵吸入端封水压力' },
  mud_pump_2_suction_seal_pressure: { value: null, unit: 'bar', label: '2#泥泵吸入端封水压力' },
  mud_pump_2_shaft_seal_pressure: { value: null, unit: 'bar', label: '2#泥泵轴端封水压力' },
  right_ear_draft: { value: null, unit: 'm', label: '右耳轴吃水' },
  left_anchor_rod_angle: { value: null, unit: '°', label: '左抛锚杆角度' },
  right_anchor_rod_angle: { value: null, unit: '°', label: '右抛锚杆角度' },
  flow_velocity: { value: null, unit: 'm/s', label: '流速' },
  density: { value: null, unit: 't/m³', label: '密度' },
  underwater_pump_motor_current: { value: null, unit: 'A', label: '水下泵电机电流' },
  underwater_pump_motor_voltage: { value: null, unit: 'V', label: '水下泵电机电压' },
  underwater_pump_torque: { value: null, unit: 'KN', label: '水下泵扭矩' },
  underwater_pump_motor_speed: { value: null, unit: 'rpm', label: '水下泵电机转速' },
  mud_pump_2_diesel_load: { value: null, unit: 'mm', label: '2#泥泵柴油机负荷' },
  mud_pump_2_diesel_speed: { value: null, unit: 'rpm', label: '2#泥泵柴油机转速' },
  mud_pump_1_diesel_load: { value: null, unit: 'mm', label: '1#泥泵柴油机负荷' },
  mud_pump_1_diesel_speed: { value: null, unit: 'rpm', label: '1#泥泵柴油机转速' },
  hydraulic_pump_diesel_load: { value: null, unit: 'mm', label: '液压泵柴油机负荷' },
  hydraulic_pump_diesel_speed: { value: null, unit: 'rpm', label: '液压泵柴油机转速' },
  gate_valve_flush_pressure: { value: null, unit: 'bar', label: '闸阀冲洗压力' },
  cutter_bearing_flush_pressure: { value: null, unit: 'bar', label: '绞刀轴承冲水压力' },
  trolley_hydraulic_cylinder_pressure: { value: null, unit: 'bar', label: '台车液压油缸压力' },
  steel_pile_hydraulic_cylinder_pressure: { value: null, unit: 'bar', label: '钢桩液压油缸压力' },
  gate_valve_system_pressure: { value: null, unit: 'bar', label: '闸阀系统压力' },
  right_transverse_pressure: { value: null, unit: 'bar', label: '右横移压力' },
  left_transverse_pressure: { value: null, unit: 'bar', label: '左横移压力' },
  trolley_travel: { value: null, unit: 'm', label: '台车行程' },
  left_transverse_speed: { value: null, unit: 'm/min', label: '左横移速度' },
  right_transverse_speed: { value: null, unit: 'm/min', label: '右横移速度' },
  mud_pump_1_discharge_pressure: { value: null, unit: 'bar', label: '1#泥泵排出压力' },
  mud_pump_2_discharge_pressure: { value: null, unit: 'bar', label: '2#泥泵排出压力' },
  underwater_pump_discharge_pressure: { value: null, unit: 'bar', label: '水下泵排出压力' },
  bridge_angle: { value: null, unit: '°', label: '桥架角度' },
  compass_angle: { value: null, unit: '°', label: '罗经角度' },
  gps1_x: { value: null, unit: '', label: 'GPS1_X' },
  gps1_y: { value: null, unit: '', label: 'GPS1_Y' },
  gps1_heading: { value: null, unit: '°', label: 'GPS1航向' },
  gps1_speed: { value: null, unit: 'kn', label: 'GPS1航速' },
  tide_level: { value: null, unit: 'm', label: '潮位' },
  water_density: { value: null, unit: 'kg/m³', label: '水密度' },
  field_slurry_density: { value: null, unit: '', label: '现场泥浆比重' },
  trim_angle: { value: null, unit: '°', label: '横倾角度' },
  pitch_angle: { value: null, unit: '°', label: '纵倾角度' },
  compass_radian: { value: null, unit: 'rad', label: '罗经弧度' },
  gps1_latitude: { value: null, unit: '°', label: 'GPS1_纬度' },
  gps1_longitude: { value: null, unit: '°', label: 'GPS1_经度' },
  ear_draft: { value: null, unit: 'm', label: '耳轴吃水' },
  transverse_speed: { value: null, unit: 'm/min', label: '横移速度' },
  rotation_radius: { value: null, unit: 'm', label: '旋转半径' },
  cutter_x: { value: null, unit: 'm', label: '绞刀x' },
  cutter_y: { value: null, unit: 'm', label: '绞刀y' },
  current_shift_output: { value: null, unit: 'm³', label: '当前班产量' },
  current_shift_output_rate: { value: null, unit: 'm³/h', label: '当前班产量率' },
  outlet_flow_velocity: { value: null, unit: 'm/s', label: '出口流速' },
  left_transverse_torque: { value: null, unit: 'KN', label: '左横移扭矩' },
  cutter_torque: { value: null, unit: 'KN', label: '绞刀扭矩' },
  right_transverse_torque: { value: null, unit: 'KN', label: '右横移扭矩' },
  left_anchor_winch_speed: { value: null, unit: 'm/min', label: '左起锚绞车速度' },
  left_anchor_winch_torque: { value: null, unit: 'KN', label: '左起锚绞车扭矩' },
  right_anchor_winch_speed: { value: null, unit: 'm/min', label: '右起锚绞车速度' },
  right_anchor_winch_torque: { value: null, unit: 'KN', label: '右起锚绞车扭矩' },
  left_swing_winch_speed: { value: null, unit: 'm/min', label: '左回转绞车速度' },
  left_swing_winch_torque: { value: null, unit: 'KN', label: '左回转绞车扭矩' },
  right_swing_winch_speed: { value: null, unit: 'm/min', label: '右回转绞车速度' },
  right_swing_winch_torque: { value: null, unit: 'KN', label: '右回转绞车扭矩' },
  bridge_winch_speed: { value: null, unit: 'm/min', label: '起桥绞车速度' },
  bridge_winch_torque: { value: null, unit: 'KN', label: '起桥绞车扭矩' },
  transverse_direction: { value: null, unit: '', label: '横移方向' },
  cutter_cutting_angle: { value: null, unit: '°', label: '绞刀切削角' },
  underwater_pump_power: { value: null, unit: 'kw', label: '水下泵功率' },
  mud_pump_1_power: { value: null, unit: 'kw', label: '1#泥泵功率' },
  mud_pump_2_power: { value: null, unit: 'kw', label: '2#泥泵功率' },
  underwater_pump_shaft_power: { value: null, unit: 'kw', label: '水下泵轴端驱动功率' },
  mud_pump_1_shaft_power: { value: null, unit: 'kw', label: '1#泥泵轴端驱动功率' },
  mud_pump_2_shaft_power: { value: null, unit: 'kw', label: '2#泥泵轴端驱动功率' },
  underwater_pump_efficiency: { value: null, unit: '', label: '水下泵泵效' },
  mud_pump_1_efficiency: { value: null, unit: '', label: '1#泥泵泵效' },
  mud_pump_2_efficiency: { value: null, unit: '', label: '2#泥泵泵效' },
  pipeline_average_concentration: { value: null, unit: '%', label: '管路平均浓度' },
  pipeline_total_damping: { value: null, unit: '', label: '管路总阻尼' },
  density_forecast: { value: null, unit: 't/m³', label: '密度预报值' },
  cutting_thickness: { value: null, unit: 'm', label: '切削厚度' },
  ship_direction: { value: null, unit: '', label: '船体方向' },
  gps1_signal_quality: { value: null, unit: '', label: '1#GPS信号质量' },
  gps2_signal_quality: { value: null, unit: '', label: '2#GPS信号质量' },
  deck_pump_1_cover_seal_pressure: { value: null, unit: 'bar', label: '[JKT]1#甲板泵盖端封水压力' },
  deck_pump_2_cover_seal_pressure: { value: null, unit: 'bar', label: '[JKT]2#甲板泵盖端封水压力' },
  deck_pump_1_shaft_seal_pressure: { value: null, unit: 'bar', label: '[JKT]1#甲板泵轴端封水压力' },
  deck_pump_2_shaft_seal_pressure: { value: null, unit: 'bar', label: '[JKT]2#甲板泵轴端封水压力' },
  cutter_drive_gate_valve_flush_pressure: {
    value: null,
    unit: 'bar',
    label: '[JKT]绞刀驱动闸阀冲水压力'
  },
  cutter_bearing_flush_pressure_jkt: { value: null, unit: 'bar', label: '[JKT]绞刀轴承冲水压力' },
  underwater_pump_cover_seal_pressure: {
    value: null,
    unit: 'bar',
    label: '[JKT]水下泵盖端封水压力'
  },
  underwater_pump_shaft_seal_pressure_jkt: {
    value: null,
    unit: 'bar',
    label: '[JKT]水下泵轴端封水压力'
  },
  deck_pump_1_gearbox_oil_temperature: {
    value: null,
    unit: '℃',
    label: '[JKT]1#甲板泵齿轮箱滑油温度'
  },
  deck_pump_1_gearbox_oil_pressure: {
    value: null,
    unit: 'bar',
    label: '[JKT]1#甲板泵齿轮箱滑油压力'
  },
  deck_pump_2_gearbox_oil_temperature: {
    value: null,
    unit: '℃',
    label: '[JKT]2#甲板泵齿轮箱滑油温度'
  },
  deck_pump_2_gearbox_oil_pressure: {
    value: null,
    unit: 'bar',
    label: '[JKT]2#甲板泵齿轮箱滑油压力'
  },
  cutter_drive_gearbox_oil_temperature: {
    value: null,
    unit: '℃',
    label: '[JKT]绞刀驱动齿轮箱滑油温度'
  },
  cutter_drive_gearbox_oil_pressure: {
    value: null,
    unit: 'bar',
    label: '[JKT]绞刀驱动齿轮箱滑油压力'
  },
  cutter_drive_gearbox_oil_saturation: {
    value: null,
    unit: '%',
    label: '[JKT]绞刀驱动齿轮箱滑油进水饱和度'
  },
  underwater_pump_gearbox_oil_temperature: {
    value: null,
    unit: '℃',
    label: '[JKT]水下泵齿轮箱滑油温度'
  },
  underwater_pump_gearbox_oil_pressure: {
    value: null,
    unit: 'bar',
    label: '[JKT]水下泵齿轮箱滑油压力'
  },
  underwater_pump_gearbox_oil_saturation: {
    value: null,
    unit: '%',
    label: '[JKT]水下泵齿轮箱滑油进水饱和度'
  },
  fuel_tank_40_level: { value: null, unit: 'm', label: '[BPJ]燃油舱40液位' },
  mer_fuel_daily_tank_level: { value: null, unit: 'm', label: '[BC]MER燃油日用柜液位' },
  fuel_tank_3_level: { value: null, unit: 'm', label: '[SBCL]燃油舱3液位' },
  lubricating_oil_tank_5_level: { value: null, unit: 'm', label: '[SBCL]滑油储存舱5液位' },
  hydraulic_oil_tank_7_level: { value: null, unit: 'm', label: '[SBCL]液压油储存舱7液位' },
  auxiliary_fuel_daily_tank_level: { value: null, unit: 'm', label: '[SBCL]辅机舱燃油日用柜液位' },
  fuel_tank_13_level: { value: null, unit: 'm', label: '[SBCL]燃油舱13液位' },
  fuel_tank_3a_level: { value: null, unit: 'm', label: '[SBCL]燃油舱3A液位' },
  fuel_tank_4_level: { value: null, unit: 'm', label: '[SBCR]燃油舱4液位' },
  sewage_tank_6_level: { value: null, unit: 'm', label: '[SBCR]污水舱6液位' },
  freshwater_tank_8_level: { value: null, unit: 'm', label: '[SBCR]淡水舱8液位' },
  dirty_oil_tank_11_level: { value: null, unit: 'm', label: '[SBCR]污油舱11液位' },
  fuel_tank_12_level: { value: null, unit: 'm', label: '[SBCR]燃油舱12液位' },
  freshwater_tank_26_level: { value: null, unit: 'm', label: '[SBCR]淡水舱26液位' },
  fuel_tank_4a_level: { value: null, unit: 'm', label: '[SBCR]燃油舱4A液位' }
})

// --- ECharts 实例 ---
let vacuumChart = null
const vacuumChartRef = ref(null)
// --- 数据分组，用于UI渲染 ---
const dataGroups = [
  {
    title: '核心生产数据',
    keys: [
      'hourly_output_rate',
      'flow_rate',
      'concentration',
      'density',
      'flow_velocity',
      'outlet_flow_velocity',
      'pipeline_average_concentration',
      'density_forecast',
      'cutting_thickness',
      'current_shift_output',
      'current_shift_output_rate'
    ]
  },
  {
    title: '绞刀与泵',
    keys: [
      'cutter_speed',
      'cutter_torque',
      'underwater_pump_speed',
      'mud_pump_1_speed',
      'mud_pump_2_speed',
      'underwater_pump_power',
      'mud_pump_1_power',
      'mud_pump_2_power',
      'underwater_pump_shaft_power',
      'mud_pump_1_shaft_power',
      'mud_pump_2_shaft_power',
      'underwater_pump_efficiency',
      'mud_pump_1_efficiency',
      'mud_pump_2_efficiency',
      'underwater_pump_motor_current',
      'underwater_pump_motor_voltage',
      'underwater_pump_motor_speed',
      'underwater_pump_torque'
    ]
  },
  {
    title: '柴油机状态',
    keys: [
      'mud_pump_1_diesel_load',
      'mud_pump_1_diesel_speed',
      'mud_pump_2_diesel_load',
      'mud_pump_2_diesel_speed',
      'hydraulic_pump_diesel_load',
      'hydraulic_pump_diesel_speed'
    ]
  },
  {
    title: '压力与真空度',
    keys: [
      'underwater_pump_discharge_pressure',
      'mud_pump_1_discharge_pressure',
      'mud_pump_2_discharge_pressure',
      'underwater_pump_suction_seal_pressure',
      'underwater_pump_shaft_seal_pressure',
      'mud_pump_1_suction_seal_pressure',
      'mud_pump_1_shaft_seal_pressure',
      'mud_pump_2_suction_seal_pressure',
      'mud_pump_2_shaft_seal_pressure',
      'gate_valve_flush_pressure',
      'cutter_bearing_flush_pressure',
      'trolley_hydraulic_cylinder_pressure',
      'steel_pile_hydraulic_cylinder_pressure',
      'gate_valve_system_pressure',
      'right_transverse_pressure',
      'left_transverse_pressure'
    ]
  },
  {
    title: '船体与桥架姿态',
    keys: [
      'bridge_angle',
      'bridge_depth',
      'left_ear_draft',
      'right_ear_draft',
      'ear_draft',
      'trolley_travel',
      'trim_angle',
      'pitch_angle',
      'transverse_speed',
      'left_transverse_speed',
      'right_transverse_speed',
      'left_transverse_torque',
      'right_transverse_torque',
      'transverse_direction',
      'cutter_cutting_angle',
      'rotation_radius',
      'ship_direction'
    ]
  },
  {
    title: '绞车状态',
    keys: [
      'left_anchor_winch_speed',
      'left_anchor_winch_torque',
      'right_anchor_winch_speed',
      'right_anchor_winch_torque',
      'left_swing_winch_speed',
      'left_swing_winch_torque',
      'right_swing_winch_speed',
      'right_swing_winch_torque',
      'bridge_winch_speed',
      'bridge_winch_torque'
    ]
  },
  {
    title: '定位与环境',
    keys: [
      'compass_angle',
      'compass_radian',
      'gps1_x',
      'gps1_y',
      'gps1_heading',
      'gps1_speed',
      'gps1_latitude',
      'gps1_longitude',
      'cutter_x',
      'cutter_y',
      'tide_level',
      'water_density',
      'field_slurry_density',
      'gps1_signal_quality',
      'gps2_signal_quality'
    ]
  },
  {
    title: '[JKT]区域数据',
    keys: [
      'deck_pump_1_cover_seal_pressure',
      'deck_pump_2_cover_seal_pressure',
      'deck_pump_1_shaft_seal_pressure',
      'deck_pump_2_shaft_seal_pressure',
      'cutter_drive_gate_valve_flush_pressure',
      'cutter_bearing_flush_pressure_jkt',
      'underwater_pump_cover_seal_pressure',
      'underwater_pump_shaft_seal_pressure_jkt',
      'deck_pump_1_gearbox_oil_temperature',
      'deck_pump_1_gearbox_oil_pressure',
      'deck_pump_2_gearbox_oil_temperature',
      'deck_pump_2_gearbox_oil_pressure',
      'cutter_drive_gearbox_oil_temperature',
      'cutter_drive_gearbox_oil_pressure',
      'cutter_drive_gearbox_oil_saturation',
      'underwater_pump_gearbox_oil_temperature',
      'underwater_pump_gearbox_oil_pressure',
      'underwater_pump_gearbox_oil_saturation'
    ]
  },
  {
    title: '液位监测',
    keys: [
      'fuel_tank_40_level',
      'mer_fuel_daily_tank_level',
      'fuel_tank_3_level',
      'lubricating_oil_tank_5_level',
      'hydraulic_oil_tank_7_level',
      'auxiliary_fuel_daily_tank_level',
      'fuel_tank_13_level',
      'fuel_tank_3a_level',
      'fuel_tank_4_level',
      'sewage_tank_6_level',
      'freshwater_tank_8_level',
      'dirty_oil_tank_11_level',
      'fuel_tank_12_level',
      'freshwater_tank_26_level',
      'fuel_tank_4a_level'
    ]
  }
]
// --- WebSocket 通信 ---
const connectToBackend = () => {
  if (!sensorAddress.value) {
    ElMessage.error('请输入传感器地址')
    return
  }

  isConnecting.value = true
  websocket = new WebSocket(BACKEND_WS_URL)

  websocket.onopen = () => {
    isConnecting.value = false
    isSensorConnected.value = true
    ElMessage.success('成功连接到后端服务')
    websocket.send(sensorAddress.value)
  }

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.error) {
      ElMessage.error(`后端错误: ${data.error}`)
      disconnectFromBackend()
      return
    }
    updateSensorData(data)
  }

  websocket.onclose = () => {
    isConnecting.value = false
    isSensorConnected.value = false
    ElMessage.warning('与后端服务的连接已断开')
  }

  websocket.onerror = (error) => {
    console.error('WebSocket Error:', error)
    isConnecting.value = false
    isSensorConnected.value = false
    ElMessage.error('连接后端服务时发生错误')
  }
}

const disconnectFromBackend = () => {
  if (websocket) {
    websocket.close()
  }
}
// --- 数据更新 ---
const updateSensorData = (data) => {
  const time = new Date()
  for (const key in data) {
    // 确保 sensorData 中存在这个 key
    if (sensorData[key] !== undefined) {
      // 更新数值
      sensorData[key].value = data[key]

      // FIX: 如果这个 key 对应的对象有 history 属性，就更新它
      if (sensorData[key].history) {
        sensorData[key].history.push({ value: [time, data[key]] })
        if (sensorData[key].history.length > MAX_HISTORY_LENGTH) {
          sensorData[key].history.shift()
        }
      }
    }
  }
  updateCharts() // 每次收到数据后都尝试更新图表
}
// --- 图表更新 ---
const initCharts = () => {
  if (vacuumChartRef.value) {
    vacuumChart = echarts.init(vacuumChartRef.value)
    const option = {
      title: {
        text: '真空度实时监控',
        textStyle: { color: '#333', fontWeight: 'bold' },
        left: 'center'
      },
      tooltip: { trigger: 'axis' },
      legend: { data: ['实际真空度', '预估真空度'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'time', splitLine: { show: false } },
      yAxis: { type: 'value', name: 'Value' }, // Y轴单位在series中定义
      series: [
        {
          name: '实际真空度',
          type: 'line',
          showSymbol: false,
          data: sensorData.underwater_pump_suction_vacuum.history, // FIX: 绑定到正确的 history
          lineStyle: { color: '#409EFF' },
          yAxisIndex: 0 // 关联到第一个y轴
        },
        {
          name: '预估真空度',
          type: 'line',
          showSymbol: false,
          data: sensorData.predictedVacuum.history, // FIX: 绑定到正确的 history
          lineStyle: { color: '#67C23A' },
          yAxisIndex: 0 // 关联到第一个y轴
        }
      ]
    }
    // 为了应对单位不同，可以使用双Y轴，但这里单位相似，暂用单轴
    // 如果需要双Y轴，可以添加 yAxis: [ {name: 'bar'}, {name: 'kPa'} ] 并设置 series 的 yAxisIndex
    vacuumChart.setOption(option)
  }
}

const updateCharts = () => {
  if (vacuumChart) {
    vacuumChart.setOption({
      series: [
        { data: sensorData.underwater_pump_suction_vacuum.history }, // FIX: 绑定到正确的 history
        { data: sensorData.predictedVacuum.history } // FIX: 绑定到正确的 history
      ]
    })
  }
}
// --- 辅助函数 ---
const formatValue = (value, precision = 2) => {
  if (value === null || value === undefined) return '--'
  return typeof value === 'number' ? value.toFixed(precision) : value
}
// --- 生命周期钩子 ---
onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})

onUnmounted(() => {
  disconnectFromBackend()
})
</script>

<template>
  <div class="realtime-data-container">
    <Title :title="shipName" />
    <div class="header-controls">
      <el-input
        v-model="sensorAddress"
        :disabled="isSensorConnected || isConnecting"
        class="address-input"
        placeholder="请输入传感器地址"
      />
      <el-button
        :disabled="isSensorConnected"
        :loading="isConnecting"
        type="primary"
        @click="connectToBackend"
      >
        {{ isSensorConnected ? '已连接' : '连接' }}
      </el-button>
      <el-button :disabled="!isSensorConnected" type="danger" @click="disconnectFromBackend"
        >断开连接</el-button
      >
      <div class="status-display">
        <span :class="['status-indicator', { connected: isSensorConnected }]"></span>
        <span class="status-text">{{ isSensorConnected ? '已连接' : '未连接' }}</span>
      </div>
    </div>

    <div class="content">
      <!-- 主要数据卡片 -->
      <div class="primary-data-cards">
        <div class="data-card primary">
          <!-- FIX: 绑定到正确的 value -->
          <div class="data-label">实际真空度</div>
          <div class="data-value large">
            <span>{{ formatValue(sensorData.underwater_pump_suction_vacuum.value) }}</span>
            <span class="data-unit">{{ sensorData.underwater_pump_suction_vacuum.unit }}</span>
          </div>
        </div>
        <div class="data-card primary">
          <!-- FIX: 绑定到正确的 value -->
          <div class="data-label">预估真空度</div>
          <div class="data-value large">
            <span>{{ formatValue(sensorData.predictedVacuum.value) }}</span>
            <span class="data-unit">{{ sensorData.predictedVacuum.unit }}</span>
          </div>
        </div>
      </div>

      <!-- 真空度图表 -->
      <div ref="vacuumChartRef" class="chart-container"></div>

      <!-- 次要数据分组展示 -->
      <div v-for="group in dataGroups" :key="group.title" class="data-group">
        <h3 class="group-title">{{ group.title }}</h3>
        <div class="secondary-data-cards">
          <div v-for="key in group.keys" :key="key" class="data-card secondary">
            <div class="data-label">{{ sensorData[key]?.label || key }}</div>
            <div class="data-value">
              <span>{{ formatValue(sensorData[key]?.value) }}</span>
              <span class="data-unit">{{ sensorData[key]?.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.realtime-data-container {
  padding: 20px;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.address-input {
  flex-grow: 1;
}

.status-display {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 0 15px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #f56c6c;
  margin-right: 8px;
  transition: background-color 0.3s;
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
  padding-right: 10px;
}

.primary-data-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.data-group {
  margin-bottom: 25px;
}

.group-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.secondary-data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.data-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition:
    box-shadow 0.3s,
    transform 0.3s;
}
.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.data-card.primary {
  padding: 25px;
}

.data-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: bold;
}

.data-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.data-value.large {
  font-size: 36px;
}

.data-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
  font-weight: normal;
}

.chart-container {
  height: 400px;
  width: 100%;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  box-sizing: border-box;
}

/* 滚动条美化 */
.content::-webkit-scrollbar {
  width: 6px;
}
.content::-webkit-scrollbar-track {
  background: #f0f2f5;
}
.content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}
.content::-webkit-scrollbar-thumb:hover {
  background: #a8abb2;
}
</style>
