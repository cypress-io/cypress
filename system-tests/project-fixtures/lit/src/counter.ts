import {LitElement, html} from 'lit'
import {customElement, query, property} from 'lit/decorators.js'

@customElement('my-counter')
export class MyCounter extends LitElement {
  @property({attribute: false})
  count = 0

  increment() {
    this.count++
  }

  render() {
    return html`<div>
      <h1>Count is ${this.count}</h1>
      <button @click=${this.increment}></button>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "my-counter": MyCounter;
  }
}