import 'tslib'
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css'

import 'xe-utils'
import VxeList from 'vxe-table/packages/list'
import { XEResizeObserver } from 'vxe-table/packages/tools'
import 'vxe-table/lib/style.css'

declare global {
  interface Window {
    ResizeObserver: typeof XEResizeObserver
  }
}

createApp(App).use(ElementPlus).use(VxeList).mount('#app')
