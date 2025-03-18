<script setup>
import { ref ,nextTick} from 'vue'
import {dayjs} from "element-plus";

const exportInfo = ref({
  shiftName: '',
  startTime: '',
  endTime:'',
  pieImg: '',
  scatterImg: '',
  tableData: []
})



window.api.getReportMessage(async (message) => {
  exportInfo.value = message
  await nextTick()
  window.api.readyDownload()
})
</script>

<template>
  <div class="export-index">
    <div class="floor">
      <div class="name">船名</div>
      <div class="value">：{{ exportInfo.shiftName }}</div>
    </div>
    <div class="floor">
      <div class="name">施工时间</div>
      <div class="value">：{{ dayjs(exportInfo.startTime).format('YYYY-MM-DD') }}————{{ dayjs(exportInfo.endTime).format('YYYY-MM-DD') }}</div>
    </div>
    <div class="floor-1">
      <div class="title">班组统计表格</div>
      <div class="info">
        <el-table :data="exportInfo.tableData" :border="true" stripe style="width: 100%" class="table">
          <el-table-column label="班组" prop="shiftName"></el-table-column>
          <el-table-column sortable label="施工时长(min)" prop="workDuration"></el-table-column>
          <el-table-column sortable label="班组总产量(m³)" prop="totalProduction"></el-table-column>
          <el-table-column sortable label="总能耗(kW·h)" prop="totalEnergy"></el-table-column>
        </el-table>
      </div>
    </div>
    <div class="floor-1">
      <div class="title">班组统计信息</div>
      <div class="info">
        <img class="img" :src="exportInfo.pieImg" alt="" />
      </div>
    </div>
    <div class="floor-1">
      <div class="title">最优班组施工参数</div>
      <div class="info">
        <img class="img" :src="exportInfo.scatterImg" alt="" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-index {
  width: 800px;
  height: 1200px;
  display: flex;
  flex-direction: column;
  padding: 20px 60px;
  page-break-inside: avoid; /* 避免内容内部分页 */
  break-inside: avoid; /* 现代浏览器支持 */
  .floor{
    display: flex;
    align-items: center;
    padding: 16px 0;
    .name{
      width: 200px;
      font-weight: bold;
      font-size: 24px;
      text-align: justify;
      text-align-last: justify;
    }
    .value{
      width: 500px;
      font-weight: bold;
      font-size: 24px;
    }
  }
  .floor-1{
    display: flex;
    flex-direction: column;
    padding: 16px 0;
    .title{
      width: 200px;
      font-weight: bold;
      font-size: 24px;
      padding: 16px 0;
      text-align: justify;
      text-align-last: justify;
    }
    .info{
      width: 800px;
      .img{
        width: 800px;
      }
    }
  }
}
</style>
