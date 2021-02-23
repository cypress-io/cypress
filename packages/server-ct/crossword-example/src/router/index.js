import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)
const routes = [{
  path: '*.js/', // component/App.spec.js/
  name: 'Home',
  component: Home,
},
{
  path: '/',
  name: 'Home',
  component: Home,
},
// component/App.spec.js/2018-10-10 <- Real Param
{ path: '*(/component/)?/:date', component: Home }]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
