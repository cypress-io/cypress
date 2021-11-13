import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import LaunchpadApp from './LaunchpadApp.vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { makeUrqlClient, preloadLaunchpadData } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'
import { initHighlighter } from '@cy/components/ShikiHighlight.vue'
import { createPinia } from 'pinia'

const app = createApp(LaunchpadApp)

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
})

app.use(createI18n())
app.use(createPinia())

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
// @ts-ignore
Promise.all([
  initHighlighter(),
  preloadLaunchpadData(),
]).then(() => {
  app.use(urql, makeUrqlClient('launchpad'))
  app.mount('#app')
})
