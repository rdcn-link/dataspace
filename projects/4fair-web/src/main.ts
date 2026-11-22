import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'iconify-icon'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { migrateLegacyAuthStorage } from '@/utils/authSession'

migrateLegacyAuthStorage()

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

void router.isReady().then(() => {
  if (router.currentRoute.value.name === 'Index') {
    window.scrollTo(0, 0)
  }
})

app.mount('#app')
