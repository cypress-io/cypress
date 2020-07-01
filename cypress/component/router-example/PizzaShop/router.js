import Vue from 'vue'
import VueRouter from 'vue-router'
import PizzaShop from './index'
import Home from './Home'
import Order from './Order'

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
