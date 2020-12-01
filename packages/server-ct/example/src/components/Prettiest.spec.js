/* eslint-env mocha,chai,jest */

// import '../main'
import HelloWorld from './HelloWorld'
import { mount } from '@vue/test-utils'
import Vue from 'vue'
// import Vue from 'vue'

Vue.config.productionTip = false

describe('Prettiest', () => {
  it('spec works', async () => {
    // window.Vue = Vue
    // new Vue(HelloWorld).$mount('#root')
    const wrapper = mount(HelloWorld, { attachTo: '#__cy_app' })

    expect(wrapper.exists()).to.eq(true)
    // const ret = await cy.get('h1')
    // expect(ret.length).to.eq(1)
  })

  it('works again', async () => {
    // window.Vue = Vue
    // new Vue(HelloWorld).$mount('#root')
    const wrapper = mount(HelloWorld, { attachTo: '#__cy_app' })

    expect(wrapper.exists()).to.eq(true)
    // const ret = await cy.get('h1')
    // expect(ret.length).to.eq(1)
  })
})
