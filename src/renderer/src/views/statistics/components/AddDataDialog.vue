<script setup>
import { ref } from 'vue'
import { ElUpload, ElMessage } from 'element-plus'
import searchApi from '../../../api/search/index'
import { useLoadingStore } from '../../../store/loadingStore'

const store = useLoadingStore()

const emit = defineEmits(['addData'])

// eslint-disable-next-line vue/require-prop-types
const dialogVisible = defineModel()
const fileName = ref('')
const shipName = ref('')
const dataType = ref(1)

const formData = new FormData()

function uploadFile(file) {
  const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx')
  if (isExcel) {
    // 使用正则表达式匹配所有日期部分
    const regex = /(\d{4})/g
    let match
    let firstDateStartIndex = null
    while ((match = regex.exec(file.name)) !== null) {
      if (firstDateStartIndex === null) {
        firstDateStartIndex = match.index // 获取第一个日期部分的起始索引
      }
    }
    if (firstDateStartIndex !== null) {
      shipName.value = file.name.substring(0, firstDateStartIndex) // 截取第一个日期前的文字
    } else {
      ElMessage.error('船名匹配失败')
    }
    fileName.value = file.name
    formData.append('file', file.raw)
  } else {
    ElMessage.error('只能导入excel文件，且为xls和xlsx格式')
  }
}

function addFile() {
  if (!fileName.value) {
    ElMessage.error('请先导入文件')
    return
  }
  if (!shipName.value) {
    ElMessage.error('请输入船名')
    return
  }
  store.setLoading(true)
  formData.append('shipName', shipName.value)
  formData.append('cover', dataType.value === 1)
  searchApi.uploadFile(formData).then(
    () => {
      setTimeout(() => {
        ElMessage.success('导入成功')
        store.setLoading(false)
        // 正则表达式匹配日期格式 YYYY-MM-DD
        const regex = /(\d{4}-\d{2}-\d{2})/
        // 查找第一个匹配的日期部分
        const match = fileName.value.match(regex)
        const dateStr = match[0] // 提取的日期字符串，例如 "2024-06-21"
        // 将日期字符串转换为 Date 对象
        const date = new Date(`${dateStr}T00:00:00`)
        // 获取当天的零点零分零秒的时间戳
        const startOfDayTimestamp = date.getTime()
        // 设置当天的23点59分59秒999毫秒
        const endOfDayTimestamp = new Date(date.setHours(23, 59, 59, 999)).getTime()
        emit('addData', {
          shipName: shipName.value,
          timeRange: [startOfDayTimestamp, endOfDayTimestamp]
        })
      }, 1000)
    },
    () => {
      ElMessage.error('导入失败')
      store.setLoading(false)
    }
  )
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :append-to-body="true"
    title="上传数据"
    width="800"
    @close="dialogVisible = false"
  >
    <template #header>
      <div class="font-size-20 font-bold">上传数据</div>
    </template>
    <div class="content">
      <div class="floor">
        <div class="name">文件名称</div>
        <div class="value">
          <el-input v-model="fileName" disabled></el-input>
          <el-upload
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            :show-file-list="false"
            action=""
            :auto-upload="false"
            :on-change="uploadFile"
          >
            <el-button type="primary" @click="addDialogVisible = true">
              <el-icon>
                <DocumentAdd />
              </el-icon>
            </el-button>
          </el-upload>
        </div>
      </div>
      <div class="floor">
        <div class="name">船名</div>
        <div class="value">
          <el-input v-model.trim="shipName" disabled></el-input>
        </div>
      </div>
      <div class="floor">
        <div class="name">数据处理方式</div>
        <div class="value">
          <el-radio-group v-model="dataType">
            <el-radio :value="1" size="large">覆盖</el-radio>
            <el-radio :value="2" size="large">追加</el-radio>
          </el-radio-group>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addFile"> 添加</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.content {
  padding: 44px 60px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 340px;

  .floor {
    display: flex;
    align-items: center;
    margin: 16px 0;

    .name {
      width: 140px;
      text-align: right;
      padding-right: 12px;
    }

    .value {
      display: flex;
      align-items: center;

      .el-input {
        width: 320px;
      }

      :deep(.el-upload) {
        width: 60px;
        height: 46px;
        border: 1px solid #d9d9d9;
        border-radius: 0;

        .el-button {
          width: 60px;
          height: 46px;
          border-radius: 0;
        }
      }
    }
  }
}
</style>
