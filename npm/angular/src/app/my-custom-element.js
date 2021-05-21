;(function () {
  const template = document.createElement('template')

  template.innerHTML = `
    <style>
      button {
          color : red
      }
    </style>
    <div>
      <button type="button">Custom element button</button>
    </div>
  `

  class MyCustomElement extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
      this.shadowRoot.appendChild(template.content.cloneNode(true))
    }
  }

  window.customElements.define('my-custom-element', MyCustomElement)
})()
