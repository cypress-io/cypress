import { createApp, h } from 'vue'
import App from './App.vue'

/* eslint-disable no-new */
createApp({
  render () {
    return h(App)
  },
  components: { App },
}).mount('#el')
