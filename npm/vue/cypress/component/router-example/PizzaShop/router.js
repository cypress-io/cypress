import { createRouter, createWebHashHistory } from 'vue-router'
import PizzaShop from './index'
import Home from './Home'
import Order from './Order'

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
