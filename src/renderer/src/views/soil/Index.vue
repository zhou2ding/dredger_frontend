<script setup>
import { ref } from 'vue'
// import PlanarPointCloud from './components/PlanarPointCloud.vue'
// import ContourPointCloud from './components/ContourPointCloud.vue'
// import ThreeDPointCloudModel from './components/ThreeDPointCloudModel.vue'
import SoilStatusStatistics from './components/SoilStatusStatistics.vue'
import SpecifiedAreaSoilIdentification from './components/SpecifiedAreaSoilIdentification.vue'
import PileProfileChart from './components/PileProfileChart.vue'

const activeTab = ref('statistics')
</script>

<template>
  <div>
    <el-tabs v-model="activeTab" type="border-card">
      <!--      <el-tab-pane label="生成平面点云" name="planar" :lazy="true">-->
      <!--        <PlanarPointCloud />-->
      <!--      </el-tab-pane>-->
      <!--      <el-tab-pane label="生成点云轮廓" name="contour" :lazy="true">-->
      <!--        <ContourPointCloud />-->
      <!--      </el-tab-pane>-->
      <!--      <el-tab-pane label="三维点云模型" name="threeD" :lazy="true">-->
      <!--        <ThreeDPointCloudModel />-->
      <!--      </el-tab-pane>-->
      <el-tab-pane label="土质状态统计图" name="statistics" :lazy="true">
        <SoilStatusStatistics />
      </el-tab-pane>
      <el-tab-pane label="指定区域土质识别" name="specified" :lazy="true">
        <SpecifiedAreaSoilIdentification />
      </el-tab-pane>
      <el-tab-pane label="桩状图/剖面图" name="pile" :lazy="true">
        <PileProfileChart />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
:deep(.el-tabs__content) {
  overflow-y: auto;
  padding: 20px;
}
</style>
