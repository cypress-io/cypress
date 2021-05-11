import { initEnv, mount } from 'cypress-angular-unit-test'
import { AppModule } from '../app.module'
import { AssetsImageComponent } from './assets-image.component'

describe('AssetsImageComponent', () => {
  it('should create', () => {
    initEnv(AssetsImageComponent)
    mount(AssetsImageComponent)
    // add "fileServerFolder": "src" in cypress.json
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

  it('should create with AppModule', () => {
    initEnv({ imports: [AppModule] })
    mount(AssetsImageComponent)
    // add "fileServerFolder": "src" in cypress.json
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
