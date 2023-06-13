import { createApp } from 'vue'
import { HeaderBar_HeaderBarQueryDocument } from './generated/graphql'
import './main.scss'
import 'tailwindcss/tailwind.css'
import urql from '@urql/vue'
import App from './App.vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { makeUrqlClient } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'
import { initHighlighter } from '@packages/frontend-shared/src/components/highlight'
import { createPinia } from '@packages/frontend-shared/src/store'

const app = createApp(App)

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
  draggable: false,
  closeOnClick: false,
})

app.use(createI18n())
app.use(createPinia())

Promise.all([
  makeUrqlClient({ target: 'launchpad' }).then((launchpadClient) => {
    app.use(urql, launchpadClient)

    // Loading the Header Bar Query document prior to mounting leads to a better experience
    // when doing things like taking snapshots of the DOM during testing, and it
    // shouldn't be any different to the user
    return launchpadClient
    .query(HeaderBar_HeaderBarQueryDocument)
    .toPromise()
  }),
  // Make sure highlighter is initialized immediately at app
  // start, so it's available when we render code blocks
  initHighlighter(),
]).then(() => {
  app.mount('#app')
})
