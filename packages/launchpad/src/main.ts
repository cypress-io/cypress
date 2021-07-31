import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import App from './App.vue'
import { createStoreApp } from './store/app'

const app = createApp(App)

const storeApp = createStoreApp()

app.use(storeApp)

app.mount('#app')
