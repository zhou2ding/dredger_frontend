<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import searchApi from '../../../api/search/index'

// --- 核心改动 1：接收来自父组件的 initialShipName ---
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref(null)
const shipList = ref([])

const createInitialFormData = () => ({
  shipName: '',
  flow: 0,
  concentration: 0,
  sPumpRpm: 0,
  cutterDepth: 0,
  carriageTravel: 0,
  horizontalSpeed: 0,
  boosterPumpDischargePressure: 0,
  vacuumDegree: 0
})

const formData = ref(createInitialFormData())

onMounted(() => {
  searchApi
    .getShipList()
    .then((res) => {
      shipList.value = res.data ?? []
    })
    .catch((err) => {
      ElMessage.error('获取船名列表失败')
      console.error(err)
    })
})

watch(
  () => formData.value.shipName,
  async (newShipName) => {
    if (!newShipName) {
      formData.value = createInitialFormData()
      return
    }

    try {
      const res = await searchApi.getTheoryOptimal({ shipName: newShipName })
      const apiData = res.data

      // 【增加防御性判断】
      // 检查 apiData 是否是一个非数组的对象
      if (apiData && typeof apiData === 'object' && !Array.isArray(apiData)) {
        formData.value = apiData
      } else {
        // 如果 apiData 是 null, undefined, 或者空数组[], 都进入这里
        const initialData = createInitialFormData()
        formData.value = {
          ...initialData,
          shipName: newShipName
        }
        ElMessage.info(`“${newShipName}”暂未设置理论最优参数，请填写。`)
      }
    } catch (error) {
      console.error('获取理论最优参数失败:', error)
    }
  }
)

const handleClose = () => {
  formData.value = createInitialFormData()
  emit('update:modelValue', false)
}

const handleConfirm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await searchApi.setTheoryOptimal(formData.value)
        ElMessage.success('理论最优参数已成功保存')
        emit('save')
        handleClose()
      } catch (error) {
        console.error('提交参数失败:', error)
      }
    } else {
      ElMessage.error('请确保所有参数都已正确填写')
    }
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="设置理论最优施工参数"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" label-width="180px">
      <el-form-item label="船名" prop="shipName" :rules="{ required: true, message: '请选择船名' }">
        <el-select v-model="formData.shipName" placeholder="请选择船名" style="width: 100%">
          <el-option v-for="ship in shipList" :key="ship" :label="ship" :value="ship" />
        </el-select>
      </el-form-item>

      <el-form-item
        label="流量(m³/h)"
        prop="flow"
        :rules="{ required: true, message: '请输入流量' }"
      >
        <el-input-number
          v-model="formData.flow"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="浓度(%)"
        prop="concentration"
        :rules="{ required: true, message: '请输入浓度' }"
      >
        <el-input-number
          v-model="formData.concentration"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="水下泵转速(rpm)"
        prop="sPumpRpm"
        :rules="{ required: true, message: '请输入水下泵转速' }"
      >
        <el-input-number
          v-model="formData.sPumpRpm"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="绞刀深度(m)"
        prop="cutterDepth"
        :rules="{ required: true, message: '请输入绞刀深度' }"
      >
        <el-input-number
          v-model="formData.cutterDepth"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="台车行程(m)"
        prop="carriageTravel"
        :rules="{ required: true, message: '请输入台车行程' }"
      >
        <el-input-number
          v-model="formData.carriageTravel"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="横移速度(m/min)"
        prop="horizontalSpeed"
        :rules="{ required: true, message: '请输入横移速度' }"
      >
        <el-input-number
          v-model="formData.horizontalSpeed"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="升压泵排出压力(bar)"
        prop="boosterPumpDischargePressure"
        :rules="{ required: true, message: '请输入升压泵排出压力' }"
      >
        <el-input-number
          v-model="formData.boosterPumpDischargePressure"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="真空度(kPa)"
        prop="vacuumDegree"
        :rules="{ required: true, message: '请输入真空度' }"
      >
        <el-input-number
          v-model="formData.vacuumDegree"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>
