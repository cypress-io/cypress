import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import App from './App.vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { createI18n } from '@cy/i18n'
import { initHighlighter } from '@packages/frontend-shared/src/components/highlight'

const app = createApp(App)

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
  draggable: false,
  closeOnClick: false,
})

app.use(createI18n())

// Make sure highlighter is initialized immediately at app
// start, so it's available when we render code blocks
initHighlighter().then(() => app.mount('#app'))
