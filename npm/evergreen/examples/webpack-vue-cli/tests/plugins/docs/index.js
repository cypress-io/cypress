import Vue from 'vue'

import Docs from './Docs'

import $ from 'cash-dom'

export default function (componentInstance, mountingPoint = '#plugins') {
  const docgen = $('#docgen')[0]
  if (docgen) docgen.innerHtml = ''
  $(mountingPoint).append(`<section id="docgen"><h2>Docs</h2></section>`)

  new Vue({
    render(h) {
      return h(Docs,{
        props: {
          docgen: componentInstance.__docgenInfo
        }
      })
    }
  }).$mount('#docgen')
}
