import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/layout/Index.vue'),
    redirect: '/statistics',
    children: [
      {
        path: '/statistics',
        name: 'Statistics',
        component: () => import('../views/statistics/Index.vue')
      },
      {
        path: '/soil',
        name: 'SoilRecognition',
        component: () => import('../views/soil/Index.vue')
      },
      // 修改后的传感器路由
      {
        path: '/sensor',
        // 当访问 /sensor 时，自动跳转到历史数据页面
        redirect: '/sensor/history',
        // 这个父级路由可以有一个空的 component，或者一个包含 <router-view> 的组件
        // component: () => import('../views/sensor/Layout.vue'), // 可选
        children: [
          {
            path: 'history', // 子路由路径不需要写 /
            name: 'SensorHistory',
            // 原来的 SensorPlayback.vue 组件现在作为历史数据页面
            component: () => import('../views/sensor/SensorPlayback.vue')
          },
          {
            path: 'realtime',
            name: 'SensorRealtime',
            // 您需要创建这个组件文件: ../views/sensor/RealtimeData.vue
            component: () => import('../views/sensor/RealtimeData.vue')
          }
        ]
      },
    ]
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})
export default router
