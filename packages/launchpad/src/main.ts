import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import type { Client } from '@urql/vue'
import urql from '@urql/vue'
import App from './App.vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { makeUrqlClient, preloadLaunchpadData } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'
import { initHighlighter } from '@cy/components/ShikiHighlight.vue'

const app = createApp(App)

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
  draggable: false,
  closeOnClick: false,
})

app.use(createI18n())

let launchpadClient: Client

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
Promise.all([
  // @ts-ignore
  initHighlighter(),
  preloadLaunchpadData(),
]).then(() => {
  launchpadClient = makeUrqlClient({ target: 'launchpad' })
  app.use(urql, launchpadClient)

  app.mount('#app')
})
