import { createApp } from 'vue'
import './main.scss'
import 'virtual:windi.css'
import App from './App.vue'
import { store } from './store'
import ClickOutside from './plugins/ClickOutside'

const app = createApp(App)

app.use(store)
ClickOutside(app)

app.mount('#app')
