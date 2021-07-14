import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import App from './App.vue'
import { createStoreApp } from './store/app'
import { createStoreConfig } from './store/config'

const app = createApp(App)

const storeApp = createStoreApp()

app.use(storeApp)
app.use(createStoreConfig(storeApp))

app.mount('#app')
