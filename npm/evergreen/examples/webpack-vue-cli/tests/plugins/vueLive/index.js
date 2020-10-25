import $ from 'cash-dom'
import Vue from 'vue'
import { VueLive } from 'vue-live'

const mountOptions = { target: '#plugins' }
export default function (componentString, options) {
  const vueLive = $('#vuelive')[0]
  if (vueLive) vueLive.innerHtml = ''
  $(mountOptions.target).append(`<section id="vuelive"><h2>Live Editor</h2></section>`)

  new Vue({
    render(h) {
      return h(VueLive,{
        props: {
          code: componentString,
          components: options.components
        }
      })
    }
  }).$mount('#vuelive')
}
