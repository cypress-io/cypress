import { createApp } from 'vue'
import 'windi.css'
import App from './App.vue'

window.App = {
  start () {
    const app = createApp(App)

    app.mount('#app')
  },
}
