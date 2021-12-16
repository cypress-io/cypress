import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'
import { createRouter } from './router/router'
import { createPinia } from './store'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { createWebsocket } from './runner'

// set a global so we can run
// conditional code in the vite branch
// so that the existing runner code
// @ts-ignore
window.__vite__ = true

const app = createApp(App)

const ws = createWebsocket()

window.ws = ws

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
})

app.use(urql, makeUrqlClient('app'))
app.use(createRouter())
app.use(createI18n())
app.use(createPinia())

app.mount('#app')
