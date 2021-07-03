import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import App from './App.vue'
import { storeApp } from './store/app'
import { storeConfig } from './store/config'
import ClickOutside from './plugins/ClickOutside'

const app = createApp(App)

app.use(storeApp)
app.use(storeConfig)
ClickOutside(app)

app.mount('#app')
