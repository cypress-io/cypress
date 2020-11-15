/* eslint-env mocha,chai,jest */
/* globals cy */

// import '../main'
import HelloWorld from './HelloWorld'
// import { mount } from '@vue/test-utils'
import Vue from 'vue'
// import Vue from 'vue'

Vue.config.productionTip = false


window.parent.Vue = Vue
window.Vue = Vue
before(() => {
  const aut = document.getElementById('root')
  if (aut) aut.innerHTML = ''
})

describe('hello', () => {
  it('works', async () => {
    // window.Vue = Vue
    new Vue(HelloWorld).$mount('#root')
    // const wrapper = mount(HelloWorld, { attachTo: '#root' })
    // expect(wrapper.exists()).to.eq(true)
    // const ret = await cy.get('h1')
    // expect(ret.length).to.eq(1)
  })
})
