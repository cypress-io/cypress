import { createApp } from 'vue'
import './main.scss'
import 'tailwindcss/tailwind.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'
import { createRouter } from './router/router'
import { injectBundle } from './runner/injectBundle'
import { createPinia } from './store'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { createWebsocket } from './runner'
import { getRunnerConfigFromWindow } from './runner/get-runner-config-from-window'
import { telemetry } from '@packages/telemetry/src/browser'

// Grab the time just before loading config to include that in the cypress:app span
const now = performance.now()
const config = getRunnerConfigFromWindow()

telemetry.init({ namespace: 'cypress:app', config })
telemetry.startSpan({ name: 'cypress:app', attachType: 'root', opts: { startTime: now } })

const app = createApp(App)

const ws = createWebsocket(config)

window.ws = ws

telemetry.attachWebSocket(ws)

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
