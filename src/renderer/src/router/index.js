import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/layout/Index.vue'),
    redirect: '/statistics',
    children: [
      {
        path: '/statistics',
        component: () => import('../views/statistics/Index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})
export default router
