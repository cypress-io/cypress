import { initEnv, mount } from '@cypress/angular'
import { AppModule } from '../app.module'
import { AssetsImageComponent } from './assets-image.component'

describe('AssetsImageComponent', () => {
  // FIXME: Find out why this fails and fix it.
  it.skip('should create', () => {
    initEnv(AssetsImageComponent)
    mount(AssetsImageComponent)
    // add "fileServerFolder": "src" in cypress.config.{ts|js}
    cy.get('img#noSlash')
    .should('be.visible')
    .and(($img) => {
      const img = $img[0] as HTMLImageElement

      expect(img.naturalWidth).to.be.greaterThan(0)
    })

    cy.get('img#slash')
    .should('be.visible')
    .and(($img) => {
      const img = $img[0] as HTMLImageElement

      expect(img.naturalWidth).to.be.greaterThan(0)
    })
  })

  // FIXME: Find out why this fails and fix it.
  it.skip('should create with AppModule', () => {
    initEnv({ imports: [AppModule] })
    mount(AssetsImageComponent)
    // add "fileServerFolder": "src" in cypress.config.{ts|js}
    cy.get('img#noSlash')
    .should('be.visible')
    .and(($img) => {
      const img = $img[0] as HTMLImageElement

      expect(img.naturalWidth).to.be.greaterThan(0)
    })

    cy.get('img#slash')
    .should('be.visible')
    .and(($img) => {
      const img = $img[0] as HTMLImageElement

      expect(img.naturalWidth).to.be.greaterThan(0)
    })
  })
})
