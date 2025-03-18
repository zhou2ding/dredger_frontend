<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <div >
    <ElConfigProvider :locale="zhCn">
      <router-view></router-view>
    </ElConfigProvider>

  </div>
</template>

<style scoped></style>
