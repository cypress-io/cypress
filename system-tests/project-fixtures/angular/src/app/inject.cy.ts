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
  template: `
      <div><h2>Great Product</h2>
      <button (click)="buy()" data-testid="btn-buy">Buy</button>
      </div>`,
})
export class ProductComponent {
  constructor (private cart: Cart) {
  }

  buy () {
    this.cart.add('Great Product')
  }
}

describe('inject function', () => {
  it('should use inject to verify against a dependency implicitly', () => {
    cy.mount(ProductComponent)
    cy.inject(Cart).invoke('getItems').should('have.length', 0)
    cy.get('[data-testid=btn-buy]').click()
    cy.inject(Cart).invoke('getItems').should('have.length', 1)
  })

  it('should use inject to verify against a dependency explicitly', () => {
    cy.mount(ProductComponent)
    cy.inject(Cart).invoke('getItems').should('have.length', 0)
    cy.get('[data-testid=btn-buy]').click()
    cy.inject(Cart).should((cart) => {
      expect(cart.getItems()).to.have.length(1)
    })
  })

  it('should use inject in combination with a fake', () => {
    const cartFake = {
      items: [] as string[],
      add (product: string) {
        this.items.push(product)
      },
      getItems () {
        return this.items
      },
    }

    cy.mount(ProductComponent, { providers: [{ provide: Cart, useValue: cartFake }] })
    cy.inject(Cart).invoke('getItems').should('have.length', 0)
    cy.get('[data-testid=btn-buy]').click()
    cy.inject(Cart).invoke('getItems').should('have.length', 1)
  })
})
