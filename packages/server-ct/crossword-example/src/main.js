import Vue from 'vue'
import App from './App.vue'
import './styles/index.scss'
import store from './store'
import router from './router'

Vue.config.productionTip = false

new Vue({
  store,
  router,
  render: (h) => h(App),
}).$mount('#app')
