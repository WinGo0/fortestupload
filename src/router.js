import { createRouter, createWebHistory } from 'vue-router'
import StackedLineGraphDemo from './views/StackedLineGraphDemo.vue'

// 其他组件已注释，需要恢复时取消对应导入和路由注释：
// import CountdownPage from './countdown/CountdownPage.vue'
// import CountdownSettingsPage from './countdown/CountdownSettingsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'stacked-line-graph',
      component: StackedLineGraphDemo,
    },
    // {
    //   path: '/',
    //   name: 'countdown',
    //   component: CountdownPage,
    // },
    // {
    //   path: '/settings',
    //   name: 'countdown-settings',
    //   component: CountdownSettingsPage,
    // },
  ],
})

export default router
