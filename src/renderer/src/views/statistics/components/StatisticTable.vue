<script setup>
import Title from '../../../components/Title.vue'

// 增加了 shipName prop
const { tableData, shipName } = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  shipName: {
    type: String,
    default: ''
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
    <el-table :border="true" :data="tableData" class="table" stripe style="width: 100%">
      <el-table-column label="班组" prop="shiftName" width="80"></el-table-column>
      <el-table-column label="施工时长(min)" prop="workDuration" sortable></el-table-column>
      <el-table-column label="班组总产量(m³)" prop="totalProduction" sortable></el-table-column>
      <el-table-column
        label="单方能耗(kw·h/m³)"
        prop="totalEnergy"
        sortable
        width="210"
      ></el-table-column>
      <el-table-column
        v-if="shipName.includes('敏龙')"
        :formatter="formatSoilTypes"
        label="土质"
        prop="soilTypes"
        width="140"
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
