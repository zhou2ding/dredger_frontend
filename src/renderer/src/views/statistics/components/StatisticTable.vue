<script setup>
import Title from '../../../components/Title.vue'

const { tableData } = defineProps({
  tableData: {
    type: Array,
    default: () => []
  }
})

/**
 * 新增：格式化土质数组为字符串
 * @param row 表格行数据
 * @param column 列信息
 * @param cellValue soilTypes 数组
 * @returns {string} 格式化后的字符串
 */
const formatSoilTypes = (row, column, cellValue) => {
  if (Array.isArray(cellValue) && cellValue.length > 0) {
    return cellValue.join(', ')
  }
  return '—'
}
</script>

<template>
  <div class="statistics-table-index">
    <Title title="班组统计表格"></Title>
    <el-table :data="tableData" :border="true" stripe style="width: 100%" class="table">
      <el-table-column width="80" label="班组" prop="shiftName"></el-table-column>
      <el-table-column sortable label="施工时长(min)" prop="workDuration"></el-table-column>
      <el-table-column sortable label="班组总产量(m³)" prop="totalProduction"></el-table-column>
      <el-table-column
        width="210"
        sortable
        label="单方能耗(kw·h/m³)"
        prop="totalEnergy"
      ></el-table-column>
      <el-table-column
        width="140"
        label="土质"
        prop="soilTypes"
        :formatter="formatSoilTypes"
      ></el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.statistics-table-index {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .table {
    width: 100%;
  }
}
</style>
