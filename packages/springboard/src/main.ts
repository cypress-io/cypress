import { createApp } from 'vue'
import App from './App.vue'
import 'windi.css'

window.App = {
  start () {
    const app = createApp(App)

    app.mount('#app')
  },
}
