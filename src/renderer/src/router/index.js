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
      {
        path: '/sensor',
        name: 'Sensor',
        component: () => import('../views/sensor/Index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})
export default router
