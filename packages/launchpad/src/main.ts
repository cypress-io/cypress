import { createApp } from 'vue'
import 'virtual:windi.css'
import App from './App.vue'
import { store } from './store'

window.App = {
  start () {
    const app = createApp(App)

    app.use(store)

    app.mount('#app')
  },
}
