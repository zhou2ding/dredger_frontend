<script setup>
const { title } = defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="title-index">
    <div class="box"></div>
    {{ title }}
  </div>
</template>

<style scoped>
.title-index {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #000000;
  font-size: 18px;
  font-weight: bold;
  .box {
    width: 8px;
    height: 14px;
    background: #202127;
    margin-right: 12px;
  }
}
</style>
