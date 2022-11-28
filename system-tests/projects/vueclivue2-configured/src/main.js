import Vue from 'vue'
import App from './App.vue'
import GlobalComponentWithCustomDirective from './components/GlobalComponentWithCustomDirective.vue'
import custom from './directive'

Vue.config.productionTip = false
Vue.component('GlobalComponentWithCustomDirective', GlobalComponentWithCustomDirective)
Vue.directive('custom', custom)

new Vue({
  render (h) {
    return h(App)
  },
}).$mount('#app')
