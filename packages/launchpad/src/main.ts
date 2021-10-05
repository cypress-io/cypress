import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient } from '@packages/frontend-shared/src/graphql/urqlClient'
import { createI18n } from '@cy/i18n'

const app = createApp(App)

app.use(urql, makeUrqlClient('launchpad'))
app.use(createI18n())

app.mount('#app')
