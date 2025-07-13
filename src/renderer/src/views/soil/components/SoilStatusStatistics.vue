<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import soilApi from '../../../api/search'

const loading = ref(false)
const computationTime = ref('')
const convergedGridSize = ref('')
const totalVolume = ref('')
const form = ref({
  geologyDbFile: '',
  calculationBoundaryFile: '',
  designDepthFile: '',
  mudlineFile: '',
  referenceZ: null,
  gridDistanceXY: null,
  gridDistanceZ: null
})

async function selectFile(fieldName) {
  const filePath = await window.api.selectFile()
  if (filePath) form.value[fieldName] = filePath
}

async function handleGenerate(type) {
  if (!form.value.geologyDbFile) return ElMessage.warning('请选择所有必需的文件！')

  loading.value = true
  const payload = { ...form.value, action: type }
  try {
    const res = await soilApi.generateSolid(payload)
    computationTime.value = res.data?.computationTime || 'N/A'
    convergedGridSize.value = res.data?.convergedGridSize || 'N/A'
    totalVolume.value = res.data?.totalVolume || 'N/A'
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
          <el-form-item label="地质数据库文件(.mdb/.xlsx):">
            <el-input v-model="form.geologyDbFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="selectFile('geologyDbFile')"
                  >选择文件</el-button
                >
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="算量边界文件(.brd):">
            <el-input v-model="form.calculationBoundaryFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="selectFile('calculationBoundaryFile')"
                  >选择文件</el-button
                >
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="设计深度(.xyz):">
            <el-input v-model="form.designDepthFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="selectFile('designDepthFile')"
                  >选择文件</el-button
                >
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="泥面线(.xyz):">
            <el-input v-model="form.mudlineFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="selectFile('mudlineFile')"
                  >选择文件</el-button
                >
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="参考面z值:">
            <el-input-number
              v-model="form.referenceZ"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="x=y格网距离:">
            <el-input-number
              v-model="form.gridDistanceXY"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="z格网距离:">
            <el-input-number
              v-model="form.gridDistanceZ"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="10">
        <div class="output-area">
          <h4>计算结果</h4>
          <p>计算花费时间: {{ computationTime }}</p>
          <p>收敛格网大小: {{ convergedGridSize }}</p>
          <p>总土方量体积: {{ totalVolume }}</p>
        </div>
        <div class="action-area">
          <el-button
            type="primary"
            style="width: 100%"
            @click="handleGenerate('stats_mud_to_design')"
            >生成 (泥面线到设计深度)
          </el-button>
          <el-button
            type="success"
            style="width: 100%; margin-top: 10px; margin-left: 0"
            @click="handleGenerate('stats_design_to_mud')"
            >生成 (设计深度到泥面线)
          </el-button>
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
