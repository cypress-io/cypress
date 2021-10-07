import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient, VueToast } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'

const app = createApp(App)

app.use(VueToast)
app.use(urql, makeUrqlClient())
app.use(createI18n())

window.$app = app.mount('#app')
