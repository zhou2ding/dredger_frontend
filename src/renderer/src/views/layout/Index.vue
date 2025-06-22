<script setup>
import { ref } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import SideMenu from './components/SideMenu.vue'

// 控制菜单是否折叠
const isCollapse = ref(true)

// 切换菜单折叠状态的方法
const toggleSideBar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <div class="common-layout">
      <el-container>
        <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
          <SideMenu :is-collapse="isCollapse" @toggle-collapse="toggleSideBar" />
        </el-aside>

        <el-container>
          <el-main class="main-content">
            <router-view></router-view>
          </el-main>
        </el-container>
      </el-container>
    </div>
  </ElConfigProvider>
</template>

<style scoped>
.common-layout,
.el-container {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}

.aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}

.main-content {
  padding: 0;
  height: 100vh;
  overflow: auto;
}
</style>
