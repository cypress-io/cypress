import $ from 'cash-dom'
import './assets/styles.scss'
import Sidebar from './Sidebar'
import Vue from 'vue'

export function createApp (specNames, { runAllSpecs }) {
  window.runAllSpecs = runAllSpecs
  $('body')[0].parentElement.appendChild($(`<div id="evergreen-target" />`)[0])
  new Vue({
    render(h) {
      return h(
        Sidebar,
        { props: { specs: specNames } }
      )
    }
  }).$mount('#evergreen-target')
}
