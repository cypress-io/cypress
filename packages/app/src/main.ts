import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient } from '@packages/frontend-shared/src/graphql/urqlClient'
import { decodeBase64Unicode } from '@packages/frontend-shared/src/utils/base64'
import { createI18n } from '@cy/i18n'
import { createRouter } from './router/router'
import { injectBundle } from './runner/injectBundle'
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

const config = JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__.base64Config)) as Cypress.Config

const ws = createWebsocket(config.socketIoRoute)

window.ws = ws

// This injects the Cypress driver and Reporter, which are bundled with Webpack.
// No need to wait for it to finish - it's resolved async with a deferred promise,
// So it'll be ready when we need to run a spec. If not, we will wait for it.
injectBundle(config.namespace)

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
  draggable: false,
  closeOnClick: false,
})

makeUrqlClient({ target: 'app', namespace: config.namespace, socketIoRoute: config.socketIoRoute }).then((client) => {
  app.use(urql, client)
  app.use(createRouter())
  app.use(createI18n())
  app.use(createPinia())

  app.mount('#app')
})
