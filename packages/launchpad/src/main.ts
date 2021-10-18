import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import Toast, { POSITION } from 'vue-toastification'
// Import the CSS or use your own!
import 'vue-toastification/dist/index.css'
import { makeUrqlClient } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'

const app = createApp(App)

export const launchpadClient = makeUrqlClient('launchpad')

app.use(Toast, {
  position: POSITION.BOTTOM_RIGHT,
})

app.use(urql, launchpadClient)
app.use(createI18n())

app.mount('#app')
