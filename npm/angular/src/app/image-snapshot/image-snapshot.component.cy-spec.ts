/// <reference types="cypress-image-snapshot" />
import { mount, initEnv } from '@cypress/angular'
import { ImageSnapshotComponent } from './image-snapshot.component'

describe('ImageSnapshotComponent', () => {
  beforeEach(() => {
    initEnv(ImageSnapshotComponent)
  })

  it('should create', () => {
    mount(ImageSnapshotComponent)
    cy.matchImageSnapshot('init')
    cy.get('button').click().blur()
    cy.matchImageSnapshot('clicked')
  })
})
