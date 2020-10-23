// Actually use Cypress for this :-)
const $dom = require('@packages/driver/src/dom')
const { create } = require('@packages/driver/src/cy/mouse')

window.mouse = create()
window.$cyDom = $dom
