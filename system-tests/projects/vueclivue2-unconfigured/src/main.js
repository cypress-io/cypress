import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render (h) {
    return h(App)
  },
}).$mount('#app')
