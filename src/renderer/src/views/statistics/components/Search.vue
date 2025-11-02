<script setup>
import { dayjs, ElMessage } from 'element-plus'
import { ref } from 'vue'
import AddDataDialog from './AddDataDialog.vue'
import TheoreticalParamsDialog from './TheoreticalParamsDialog.vue'
import searchApi from '../../../api/search/index'

const shipName = ref('')
const shipList = ref([])
const now = new Date()
const time = ref([
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
])

const emit = defineEmits(['searchData', 'downLoadReportFile'])

function getShipList(name) {
  searchApi.getAllShipEffectiveDate().then((res) => {
    shipList.value = res.data ?? []
    if (shipList.value.length > 0) {
      if (name) {
        shipName.value = name
      } else {
        shipName.value = shipList.value[0].shipName
      }
      panelChange(time.value)
      search()
    }
  })
}

getShipList()

function search() {
  if (!shipName.value) {
    ElMessage.error('请选择船名')
    return
  }
  if (!time.value) {
    ElMessage.error('请选择时间')
    return
  }
  emit('searchData', {
    startDate: new Date(time.value[0]).getTime(),
    endDate: new Date(time.value[1]).getTime(),
    shipName: shipName.value
  })
}

/**
 * 保存快照
 * @returns {Promise<void>}
 */
async function getPicture() {
  const response = await window.api.captureWindow() // 输出主进程的回应
  const blob = new Blob([response], { type: 'image/png' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dayjs().format('YYYYMMDDHHmmss') + 'screenshot.png'
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}

/**
 * 将快照保存到截切版
 */
function copyPicture() {
  window.api.copyToClipboard()
}

const addDialogVisible = ref(false)

const theoreticalParamsDialogVisible = ref(false)

/**
 * 数据上传成功后；更新截面数据
 * @param val 搜索参数
 */
function updateData(val) {
  time.value = val.timeRange
  getShipList(val.shipName)
  addDialogVisible.value = false
}

/**
 * 保存理论最优参数
 */
function handleSaveTheoreticalParams() {
  console.log('子组件已成功保存理论最优参数。')
}

function handleDateChange(value) {
  if (value && value.length === 2) {
    const [startDate, endDate] = value

    // 设置开始时间为零点零分零秒
    startDate.setHours(0, 0, 0, 0)

    // 设置结束时间为当日的23点59分59秒
    endDate.setHours(23, 59, 59, 999)
    time.value = [new Date(startDate), new Date(endDate)]
  }
}

/**
 * 导出文件
 */
function exportFile() {
  if (!shipName.value) {
    ElMessage.error('请选择船名')
    return
  }
  if (!time.value) {
    ElMessage.error('请选择时间')
    return
  }
  emit('downLoadReportFile')
}

const effectiveDateList = ref([])
function handleShipChange() {
  // 每次切换船名时重新加载有效日期
  panelChange(time.value)
}

/**
 * 切换月份
 * @param val
 */
function panelChange(val) {
  const param = {
    shipName: shipName.value,
    startDate: new Date(
      new Date(val[0]).getFullYear(),
      new Date(val[0]).getMonth(),
      1,
      0,
      0,
      0,
      0
    ).getTime(),
    endDate:
      new Date(
        new Date(val[1]).getFullYear(),
        new Date(val[1]).getMonth() + 1,
        1,
        0,
        0,
        0,
        0
      ).getTime() - 1
  }
  searchApi.getShipEffectiveDate(param).then((res) => {
    effectiveDateList.value = res.data ?? []
  })
}

function setName(val) {
  return effectiveDateList.value.includes(new Date(val).getTime()) ? 'height-light' : ''
}
</script>

<template>
  <div class="search-index">
    <div class="search-item upload">
      <el-button type="primary" @click="addDialogVisible = true">
        <el-icon size="24">
          <UploadFilled></UploadFilled>
        </el-icon>
        上传
      </el-button>
    </div>
    <div class="search-item shift-name">
      <div class="name">船名</div>
      <el-select v-model="shipName" @change="handleShipChange">
        <el-option v-for="item in shipList" :key="item.shipName" :value="item.shipName">
          {{ item.shipName + ' ' + item.startDate + '—' + item.endDate }}
        </el-option>
      </el-select>
    </div>
    <div class="search-item search-time">
      <div class="name">时间</div>
      <el-date-picker
        v-model="time"
        type="daterange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        :cell-class-name="setName"
        @change="handleDateChange"
        @panel-change="panelChange"
      ></el-date-picker>
    </div>
    <el-button type="primary" class="search" @click="search">搜索</el-button>
    <div class="input">
      <el-button type="primary" class="button" @click="theoreticalParamsDialogVisible = true">
        理论最优施工参数
      </el-button>
    </div>
    <div class="capture">
      <el-button type="primary" class="screen" @click="exportFile">
        <el-icon size="24">
          <Download />
        </el-icon>
        导出
      </el-button>
      <el-button class="screen" type="primary" @click="copyPicture">
        <el-icon size="24">
          <Camera />
        </el-icon>
        快照
      </el-button>
      <el-button class="screen" type="primary" @click="getPicture">保存快照</el-button>
    </div>
  </div>
  <AddDataDialog
    v-if="addDialogVisible"
    v-model="addDialogVisible"
    @add-data="updateData"
  ></AddDataDialog>
  <TheoreticalParamsDialog
    v-if="theoreticalParamsDialogVisible"
    v-model="theoreticalParamsDialogVisible"
    @save="handleSaveTheoreticalParams"
  ></TheoreticalParamsDialog>
</template>

<style scoped>
.search-index {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 16px;

  .search-item {
    height: 44px;
    display: flex;
    align-items: center;
    width: fit-content;
    flex-wrap: nowrap;

    .name {
      width: 80px;
      text-align: right;
      padding-right: 12px;
    }
  }

  .upload {
    width: 80px;
    margin-left: 40px;
    display: flex;
    align-items: center;

    div {
      display: flex;
      align-items: center;
    }
  }

  .shift-name {
    width: 280px;
    margin-left: 40px;
  }

  .search-time {
    width: 480px;
  }

  .search {
    margin-left: 24px;
  }

  .input {
    display: flex;
    align-items: center;
    margin-left: 24px;

    .button {
      width: 160px;
    }
  }

  .capture {
    margin-left: auto;
    width: fit-content;
    display: flex;
    padding-right: 24px;

    .screen {
      margin-left: 24px;
    }
  }
}
</style>
