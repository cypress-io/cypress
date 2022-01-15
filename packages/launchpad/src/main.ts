import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql, { Client } from '@urql/vue'
import App from './App.vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { makeUrqlClient, preloadLaunchpadData } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'
import { initHighlighter } from '@cy/components/ShikiHighlight.vue'

const app = createApp(App)

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
})

app.use(createI18n())

let launchpadClient: Client

// TODO: (tim) remove this when we refactor to remove the retry plugin logic
export function getLaunchpadClient () {
  if (!launchpadClient) {
    throw new Error(`Cannot access launchpadClient before app has been init`)
  }

  return launchpadClient
}

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
