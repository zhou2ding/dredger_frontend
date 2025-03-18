<script setup>
import Title from '../../../components/Title.vue'

const { tableData } = defineProps({
  tableData: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="statistics-table-index">
    <Title title="班组统计表格"></Title>
    <el-table :data="tableData" :border="true" stripe style="width: 100%" class="table">
      <el-table-column width="160" label="班组" prop="shiftName"></el-table-column>
      <el-table-column sortable label="施工时长(min)" prop="workDuration"></el-table-column>
      <el-table-column sortable label="班组总产量(m³)" prop="totalProduction"></el-table-column>
      <el-table-column sortable label="单方能耗(kw·h/m³)" prop="totalEnergy"></el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.statistics-table-index {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .title {
    color: #000000;
    font-size: 18px;
    font-weight: bold;
    height: 44px;
    line-height: 44px;
  }

  .table {
    width: 100%;
  }
}
</style>
