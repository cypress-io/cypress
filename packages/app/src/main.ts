import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient } from '@packages/frontend-shared'
import { createI18n } from './locales/i18n'

const app = createApp(App)

app.use(urql, makeUrqlClient())
app.use(createI18n())

app.mount('#app')
