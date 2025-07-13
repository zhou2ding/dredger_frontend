<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import soilApi from '../../../api/search'

const loading = ref(false)
const computationTime = ref('')
const form = ref({
  calculationBoundaryFile: '',
  referenceZ: null,
  gridDistanceXY: null
})

async function selectFile(fieldName) {
  const filePath = await window.api.selectFile()
  if (filePath) form.value[fieldName] = filePath
}

async function handleGenerate() {
  if (!form.value.calculationBoundaryFile) return ElMessage.warning('请选择算量边界文件！')
  if (form.value.gridDistanceXY === null) return ElMessage.warning('请输入x=y格网距离！')

  loading.value = true
  const payload = { ...form.value, action: 'planar_point_cloud' }
  try {
    const res = await soilApi.generateSolid(payload)
    computationTime.value = res.data?.computationTime || 'N/A'
    ElMessage.success('生成成功！')
  } catch (error) {
    ElMessage.error('生成失败，请检查控制台。')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-loading="loading">
    <el-row :gutter="40">
      <el-col :span="14">
        <el-form class="user-form" :model="form" label-width="200px" label-position="right">
          <el-form-item label="算量边界文件(.brd):">
            <el-input v-model="form.calculationBoundaryFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="selectFile('calculationBoundaryFile')"
                  >选择文件</el-button
                >
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="参考面z值:">
            <el-input-number
              v-model="form.referenceZ"
              :controls="false"
              placeholder="请输入参考面z值"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="x=y格网距离:">
            <el-input-number
              v-model="form.gridDistanceXY"
              :controls="false"
              placeholder="请输入格网距离"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="10">
        <div class="output-area">
          <h4>计算结果</h4>
          <p>计算花费时间: {{ computationTime }}</p>
        </div>
        <div class="action-area">
          <el-button type="primary" style="width: 100%" @click="handleGenerate">开始生成</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.user-form ::v-deep .el-form-item__label {
  justify-content: flex-start !important;
  text-align: left !important;
}

.select-file-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0 10px;
}

.output-area {
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
  margin-bottom: 20px;
  min-height: 100px;
}

.output-area h4 {
  margin-top: 0;
}
</style>
