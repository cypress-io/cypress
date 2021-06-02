import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store'

declare global {
  interface Window {
    App: {
      start: () => void
    }
  }
}

window.App = {
  start () {
    const app = createApp(App)

    app.use(store)

    app.mount('#app')
  },
}
