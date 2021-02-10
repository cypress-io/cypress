import $ from 'cash-dom'
import Vue from 'vue'
import { mount } from '@cypress/vue'

describe('Vue', () => {
  it('supports devtools', () => {
    const el = $('<div id="root" />')
    document.body.outerHTML = ''
    window.Vue = Vue
    $('body').append(el)

    const App = {
      data() {
        return {
          msg: 'Hello using devtools'
        }
      },
      render(h) {
        return h('div', this.msg)
      }
    }

    new Vue(App).$mount('#root')
  })
})