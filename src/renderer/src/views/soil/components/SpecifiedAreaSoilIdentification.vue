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
  specifiedX: null,
  specifiedY: null,
  specifiedLength: null,
  specifiedWidth: null,
  depth: null,
  height: null
})
const formFiles = ref({})
const loading = ref(false)
const activeResultTab = ref('mud_to_design')

// 存储两个生成按钮的计算结果
const results = ref({
  mud_to_design: {
    // 对应 demo3
    computationTime: '',
    files: []
  },
  design_to_mud: {
    // 对应 demo4
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
    // 批量查询 demo3 和 demo4 的最新结果
    const res = await soilApi.getLatestResults('3,4')
    if (res.data) {
      if (res.data['3']) {
        results.value.mud_to_design.files = res.data['3'].files
      }
      if (res.data['4']) {
        results.value.design_to_mud.files = res.data['4'].files
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

async function handleGenerate(type) {
  if (!formFiles.value.geologyDbFile) {
    return ElMessage.warning('请选择地质数据库文件！')
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在玩命计算中，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  const startTime = Date.now()

  try {
    const demoId = type === 'mud_to_design' ? 3 : 4
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

    // demo3/4 特有参数
    if (form.value.specifiedX != null) fd.append('cx', String(form.value.specifiedX))
    if (form.value.specifiedY != null) fd.append('cy', String(form.value.specifiedY))
    if (form.value.specifiedLength != null) fd.append('length', String(form.value.specifiedLength))
    if (form.value.specifiedWidth != null) fd.append('width', String(form.value.specifiedWidth))
    if (form.value.depth != null) fd.append('depth', String(form.value.depth))
    if (form.value.height != null) fd.append('height', String(form.value.height))

    const res = await soilApi.runDemo(demoId, fd)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2) + ' 秒'

    results.value[type] = {
      computationTime: duration,
      files: res.data || []
    }
    activeResultTab.value = type
    ElMessage.success('生成成功，已列出本次新增的结果文件！')
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

          <el-divider content-position="left">指定区域</el-divider>
          <el-form-item label="x坐标:">
            <el-input-number
              v-model="form.specifiedX"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="y坐标:">
            <el-input-number
              v-model="form.specifiedY"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="length:">
            <el-input-number
              v-model="form.specifiedLength"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="width:">
            <el-input-number
              v-model="form.specifiedWidth"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="深度(depth):">
            <el-input-number
              v-model="form.depth"
              :controls="false"
              placeholder="请输入"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="高度(height):">
            <el-input-number
              v-model="form.height"
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
            <el-tab-pane label="泥面线到设计深度" name="mud_to_design">
              <div v-if="results.mud_to_design.files && results.mud_to_design.files.length > 0">
                <p v-if="results.mud_to_design.computationTime">
                  <strong>计算花费时间:</strong> {{ results.mud_to_design.computationTime }}
                </p>
                <p><strong>生成文件列表:</strong></p>
                <ul class="file-list">
                  <li v-for="file in results.mud_to_design.files" :key="file.path">
                    {{ file.name }}
                  </li>
                </ul>
                <el-button
                  type="primary"
                  plain
                  style="margin-top: 10px; width: 100%"
                  @click="openLocation(results.mud_to_design.files[0])"
                >
                  打开所在目录
                </el-button>
              </div>
              <el-empty v-else description="暂无计算结果" />
            </el-tab-pane>
            <el-tab-pane label="设计深度到泥面线" name="design_to_mud">
              <div v-if="results.design_to_mud.files && results.design_to_mud.files.length > 0">
                <p v-if="results.design_to_mud.computationTime">
                  <strong>计算花费时间:</strong> {{ results.design_to_mud.computationTime }}
                </p>
                <p><strong>生成文件列表:</strong></p>
                <ul class="file-list">
                  <li v-for="file in results.design_to_mud.files" :key="file.path">
                    {{ file.name }}
                  </li>
                </ul>
                <el-button
                  type="primary"
                  plain
                  style="margin-top: 10px; width: 100%"
                  @click="openLocation(results.design_to_mud.files[0])"
                >
                  打开所在目录
                </el-button>
              </div>
              <el-empty v-else description="暂无计算结果" />
            </el-tab-pane>
          </el-tabs>
        </div>
        <div class="action-area">
          <el-button type="primary" style="width: 100%" @click="handleGenerate('mud_to_design')">
            生成 (泥面线到设计深度)
          </el-button>
          <el-button
            type="success"
            style="width: 100%; margin-top: 10px; margin-left: 0"
            @click="handleGenerate('design_to_mud')"
          >
            生成 (设计深度到泥面线)
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
