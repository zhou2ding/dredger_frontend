<script setup>
import { DataAnalysis, Grid, Cpu, Fold, Expand } from '@element-plus/icons-vue'
import { computed } from 'vue'
// 从父组件接收折叠状态
const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['toggleCollapse'])
const handleToggle = () => {
  emit('toggleCollapse')
}
const tooltipContent = computed(() => {
  return props.isCollapse ? '展开菜单' : '折叠菜单'
})
</script>

<template>
  <div class="side-menu-container">
    <div class="logo">
      <span v-show="!isCollapse" class="logo-text">施工数据分析</span>
    </div>

    <el-tooltip effect="dark" :content="tooltipContent" placement="right">
      <div class="collapse-toggler" @click="handleToggle">
        <el-icon size="20">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
      </div>
    </el-tooltip>
    <el-menu
      active-text-color="#ffd04b"
      background-color="#304156"
      class="el-menu-vertical"
      :default-active="$route.path"
      text-color="#fff"
      :collapse="isCollapse"
      router
    >
      <el-menu-item index="/statistics">
        <el-icon>
          <DataAnalysis />
        </el-icon>
        <template #title>数据统计</template>
      </el-menu-item>
      <el-menu-item index="/soil">
        <el-icon>
          <Grid />
        </el-icon>
        <template #title>土质识别</template>
      </el-menu-item>
      <el-menu-item index="/sensor">
        <el-icon>
          <Cpu />
        </el-icon>
        <template #title>传感器</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.side-menu-container {
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;
  position: relative;
}

.logo {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.el-menu--collapse .logo-text {
  display: none;
}

.el-menu--collapse .logo-img {
  margin-right: 0;
}

.collapse-toggler {
  padding: 10px 0 10px 20px;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.collapse-toggler:hover {
  background-color: #5a738e;
}
</style>
