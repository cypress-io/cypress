import { mount } from '@cypress/vue'
import { createPinia } from 'pinia'
import { usePlugins } from '../../src/plugins'
import '../../src/main.css'
import '../../src/variables-reporter.scss'
import $ from 'jquery'

before(() => {
  $('#__cy_vue_root').append($('<div class="runner"><div class="reporter"></div></div>'))
})

Cypress.Commands.add('mount', (component, options = {}) => {
  const global = options.global || {}

  $('head').append([
    $(`<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Mulish:wght@200;300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">`),
    $(`<script src="https://kit.fontawesome.com/d68c5fa434.js" crossorigin="anonymous"></script>
`),
  ])

  delete options.global

  return mount(component, {
    global: {
      plugins: [createPinia(), ...usePlugins()],
      ...global,
    },
    ...options,
    // attachTo: $('.reporter')[0],
  })
})
