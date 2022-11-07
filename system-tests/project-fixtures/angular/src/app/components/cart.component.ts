import { Component, Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class Cart {
  #items: string[] = []

  add (product: string) {
    this.#items.push(product)
  }

  getItems () {
    return this.#items
  }
}

@Component({
  template: `<div><h2>Great Product</h2><button (click)="buy()" data-testid="btn-buy">Buy</button></div>`,
})
export class ProductComponent {
  constructor (private cart: Cart) {
  }

  buy () {
    this.cart.add('Great Product')
  }
}
