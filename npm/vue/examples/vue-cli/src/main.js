import { createApp, h } from 'vue'
import App from './App.vue'
import './registerServiceWorker'

createApp({
  render: () => h(App),
}).mount('#app')
