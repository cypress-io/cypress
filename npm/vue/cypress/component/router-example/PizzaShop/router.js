import { createRouter, createWebHashHistory } from 'vue-router'
import PizzaShop from './index.vue'
import Home from './Home.vue'
import Order from './Order.vue'

export default createRouter({
  history: createWebHashHistory(),
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
