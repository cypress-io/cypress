import Vue from 'vue'
import VueRouter from 'vue-router'
import PizzaShop from './index.vue'
import Home from './Home.vue'
import Order from './Order.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    {
      path: '/',
      component: PizzaShop,
      children: [
        { path: '', name: 'home', component: Home },
        { path: 'order/:preset?', name: 'order', component: Order },
      ],
    },
  ],
})
