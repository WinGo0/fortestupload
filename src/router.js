import { createRouter, createWebHistory } from 'vue-router'
import MonitorPage from './views/MonitorPage.vue'

// 旧演示页和其他页面暂不参与路由，需要时再取消注释：
// import StackedLineGraphDemo from './views/StackedLineGraphDemo.vue'
// import CountdownPage from './countdown/CountdownPage.vue'
// import CountdownSettingsPage from './countdown/CountdownSettingsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'monitor-page',
      component: MonitorPage,
    },
    // {
    //   path: '/stacked-line-graph',
    //   name: 'stacked-line-graph',
    //   component: StackedLineGraphDemo,
    // },
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
