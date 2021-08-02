import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import urql from '@urql/vue'
import App from './App.vue'
import { makeUrqlClient } from './graphql/urqlClient'

const app = createApp(App)

app.use(urql, makeUrqlClient())

app.mount('#app')
