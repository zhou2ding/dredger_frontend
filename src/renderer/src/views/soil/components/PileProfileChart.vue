<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import soilApi from '../../../api/search'

// --- 状态定义 ---
const form = ref({
  geologyDbFile: '',
  calculationBoundaryFile: '',
  designDepthFile: '',
  mudlineFile: '',
  referenceZ: null,
  gridDistanceXY: null,
  gridDistanceZ: null,
  pileX: null,
  pileY: null,
  profileX1: null,
  profileY1: null,
  profileX2: null,
  profileY2: null,
  threshold: null
})
const formFiles = ref({})
const loading = ref(false)
const activeResultTab = ref('pile_chart')

const results = ref({
  pile_chart: {
    // 对应 demo5
    computationTime: '',
    files: []
  },
  profile_chart: {
    // 对应 demo6
    computationTime: '',
    files: []
  }
})

// --- 生命周期钩子 ---
onMounted(() => {
  fetchLatestResults()
})

// --- 方法定义 ---
async function fetchLatestResults() {
  loading.value = true
  try {
    const res = await soilApi.getLatestResults('5,6')
    if (res.data) {
      if (res.data['5']) {
        results.value.pile_chart.files = res.data['5'].files
      }
      if (res.data['6']) {
        results.value.profile_chart.files = res.data['6'].files
      }
    }
  } catch (error) {
    if (error.response && error.response.status !== 404) {
      ElMessage.error('获取历史计算结果失败！')
    }
    console.error('获取历史结果失败:', error)
  } finally {
    loading.value = false
  }
}

function handleFileSelect(event, fieldName) {
  const file = event.target.files[0]
  if (file) {
    form.value[fieldName] = file.name
    formFiles.value[fieldName] = file
  }
}

// 统一的生成函数
async function handleGenerate(type) {
  if (!formFiles.value.geologyDbFile) {
    return ElMessage.warning('请选择地质数据库文件！')
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在计算中，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  const startTime = Date.now()

  try {
    const demoId = type === 'pile_chart' ? 5 : 6
    const fd = new FormData()

    // 文件
    if (formFiles.value.geologyDbFile) fd.append('geo_path', formFiles.value.geologyDbFile)
    if (formFiles.value.calculationBoundaryFile)
      fd.append('brd_path', formFiles.value.calculationBoundaryFile)
    if (formFiles.value.designDepthFile) fd.append('design_xyz', formFiles.value.designDepthFile)
    if (formFiles.value.mudlineFile) fd.append('mud_xyz', formFiles.value.mudlineFile)

    // 通用参数
    if (form.value.referenceZ != null) fd.append('ref_z', String(form.value.referenceZ))
    if (form.value.gridDistanceXY != null) fd.append('grid_xy', String(form.value.gridDistanceXY))
    if (form.value.gridDistanceZ != null) fd.append('grid_z', String(form.value.gridDistanceZ))

    // 根据类型添加特定参数
    if (type === 'pile_chart') {
      if (form.value.pileX != null) fd.append('cx', String(form.value.pileX))
      if (form.value.pileY != null) fd.append('cy', String(form.value.pileY))
    } else {
      // profile_chart
      if (form.value.profileX1 != null) fd.append('x1', String(form.value.profileX1))
      if (form.value.profileY1 != null) fd.append('y1', String(form.value.profileY1))
      if (form.value.profileX2 != null) fd.append('x2', String(form.value.profileX2))
      if (form.value.profileY2 != null) fd.append('y2', String(form.value.profileY2))
      if (form.value.threshold != null) fd.append('threshold', String(form.value.threshold))
    }

    const res = await soilApi.runDemo(demoId, fd)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2) + ' 秒'

    results.value[type] = {
      computationTime: duration,
      files: res.data || []
    }
    activeResultTab.value = type
    ElMessage.success('生成成功！')
  } catch (e) {
    console.error(e)
    ElMessage.error('生成失败，请检查控制台。')
  } finally {
    loadingInstance.close()
  }
}

async function openLocation(file) {
  if (!file || !file.path) {
    ElMessage.warning('文件路径无效！')
    return
  }
  try {
    await soilApi.openFileLocation(file.path)
    ElMessage.success('已发送打开目录指令！')
  } catch (error) {
    ElMessage.error('打开目录失败，请检查后端服务状态。')
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
                <el-button class="select-file-btn" @click="$refs.geologyDbFileRef.click()"
                  >选择文件</el-button
                >
              </template>
            </el-input>
            <input
              type="file"
              ref="geologyDbFileRef"
              style="display: none"
              @change="handleFileSelect($event, 'geologyDbFile')"
              accept=".mdb,.xlsx"
            />
          </el-form-item>
          <el-form-item label="算量边界文件(.brd):">
            <el-input v-model="form.calculationBoundaryFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="$refs.calculationBoundaryFileRef.click()"
                  >选择文件</el-button
                >
              </template>
            </el-input>
            <input
              type="file"
              ref="calculationBoundaryFileRef"
              style="display: none"
              @change="handleFileSelect($event, 'calculationBoundaryFile')"
              accept=".brd"
            />
          </el-form-item>
          <el-form-item label="设计深度(.xyz):">
            <el-input v-model="form.designDepthFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="$refs.designDepthFileRef.click()"
                  >选择文件</el-button
                >
              </template>
            </el-input>
            <input
              type="file"
              ref="designDepthFileRef"
              style="display: none"
              @change="handleFileSelect($event, 'designDepthFile')"
              accept=".xyz"
            />
          </el-form-item>
          <el-form-item label="泥面线(.xyz):">
            <el-input v-model="form.mudlineFile" readonly placeholder="请选择文件">
              <template #append>
                <el-button class="select-file-btn" @click="$refs.mudlineFileRef.click()"
                  >选择文件</el-button
                >
              </template>
            </el-input>
            <input
              type="file"
              ref="mudlineFileRef"
              style="display: none"
              @change="handleFileSelect($event, 'mudlineFile')"
              accept=".xyz"
            />
          </el-form-item>

          <el-divider />
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

          <el-divider content-position="left">查询坐标</el-divider>
          <el-form-item label="桩状图 (x, y):">
            <el-col :span="12">
              <el-input-number
                v-model="form.pileX"
                :controls="false"
                placeholder="X坐标"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-input-number
                v-model="form.pileY"
                :controls="false"
                placeholder="Y坐标"
                style="width: 100%"
              />
            </el-col>
          </el-form-item>
          <el-form-item label="剖面图 (x1, y1):">
            <el-col :span="12">
              <el-input-number
                v-model="form.profileX1"
                :controls="false"
                placeholder="X1坐标"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-input-number
                v-model="form.profileY1"
                :controls="false"
                placeholder="Y1坐标"
                style="width: 100%"
              />
            </el-col>
          </el-form-item>
          <el-form-item label="剖面图 (x2, y2):">
            <el-col :span="12">
              <el-input-number
                v-model="form.profileX2"
                :controls="false"
                placeholder="X2坐标"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-input-number
                v-model="form.profileY2"
                :controls="false"
                placeholder="Y2坐标"
                style="width: 100%"
              />
            </el-col>
          </el-form-item>
          <el-form-item label="阈值:">
            <el-input-number
              v-model="form.threshold"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </el-col>

      <el-col :span="10">
        <div class="output-area">
          <el-tabs v-model="activeResultTab">
            <el-tab-pane label="桩状图" name="pile_chart">
              <div v-if="results.pile_chart.files && results.pile_chart.files.length > 0">
                <p v-if="results.pile_chart.computationTime">
                  <strong>计算花费时间:</strong> {{ results.pile_chart.computationTime }}
                </p>
                <p><strong>生成文件列表:</strong></p>
                <ul class="file-list">
                  <li v-for="file in results.pile_chart.files" :key="file.path">
                    {{ file.name }}
                  </li>
                </ul>
                <el-button
                  type="primary"
                  plain
                  style="margin-top: 10px; width: 100%"
                  @click="openLocation(results.pile_chart.files[0])"
                >
                  打开所在目录
                </el-button>
              </div>
              <el-empty v-else description="暂无计算结果" />
            </el-tab-pane>
            <el-tab-pane label="剖面图" name="profile_chart">
              <div v-if="results.profile_chart.files && results.profile_chart.files.length > 0">
                <p v-if="results.profile_chart.computationTime">
                  <strong>计算花费时间:</strong> {{ results.profile_chart.computationTime }}
                </p>
                <p><strong>生成文件列表:</strong></p>
                <ul class="file-list">
                  <li v-for="file in results.profile_chart.files" :key="file.path">
                    {{ file.name }}
                  </li>
                </ul>
                <el-button
                  type="primary"
                  plain
                  style="margin-top: 10px; width: 100%"
                  @click="openLocation(results.profile_chart.files[0])"
                >
                  打开所在目录
                </el-button>
              </div>
              <el-empty v-else description="暂无计算结果" />
            </el-tab-pane>
          </el-tabs>
        </div>
        <div class="action-area">
          <el-button type="primary" style="width: 100%" @click="handleGenerate('pile_chart')">
            生成桩状图
          </el-button>
          <el-button
            type="success"
            style="width: 100%; margin-top: 10px; margin-left: 0"
            @click="handleGenerate('profile_chart')"
          >
            生成剖面图
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
}
.output-area {
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  margin-bottom: 20px;
  min-height: 100px;
}
.output-area .file-list {
  list-style-type: disc;
  padding-left: 20px;
  margin: 5px 0;
}
.output-area .file-list li {
  line-height: 1.8;
  color: #606266;
}
.action-area {
  margin-top: 20px;
}
</style>
