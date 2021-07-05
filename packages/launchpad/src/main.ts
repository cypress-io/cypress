import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import App from './App.vue'
import { createStoreApp } from './store/app'
import { createStoreConfig } from './store/config'
import ClickOutside from './plugins/ClickOutside'

const app = createApp(App)

const storeApp = createStoreApp()

app.use(storeApp)
app.use(createStoreConfig(storeApp))
ClickOutside(app)

app.mount('#app')
