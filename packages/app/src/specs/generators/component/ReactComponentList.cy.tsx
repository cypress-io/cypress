import { ComponentList_GetReactComponentsFromFileDocument } from '../../../generated/graphql-test'
import ReactComponentList from './ReactComponentList.vue'

describe('ReactComponentList', () => {
  const mockFile = {
    absolute: '/path/to/my/component',
    id: 'fileId',
    relative: '../path/to/my/component',
    fileName: 'Component.js',
    fileExtension: '.tsx', baseName: 'Component',
  }

  it('renders empty state if no components are returned', () => {
    cy.stubMutationResolver(ComponentList_GetReactComponentsFromFileDocument, (defineResult) => {
      return defineResult({ getReactComponentsFromFile: { components: [], errored: false } })
    })

    cy.mount(<ReactComponentList file={mockFile} />)

    cy.contains('No components found').should('be.visible')
  })

  it('renders error state if errored is true', () => {
    cy.stubMutationResolver(ComponentList_GetReactComponentsFromFileDocument, (defineResult) => {
      return defineResult({ getReactComponentsFromFile: { components: [], errored: true } })
    })

    cy.mount(<ReactComponentList file={mockFile} />)

    cy.contains('Unable to parse file').should('be.visible')
  })

  it('fetches and displays a list of components', () => {
    cy.mount(<ReactComponentList file={mockFile} />)

    cy.contains('FooBar').should('be.visible')
    cy.contains('BarFoo').should('be.visible')
    cy.contains('FooBarBaz').should('be.visible')
  })

  it('calls selectItem on click', () => {
    const onSelectItemStub = cy.stub()

    cy.mount(<ReactComponentList file={mockFile} onSelectItem={onSelectItemStub} />)

    cy.contains('FooBar').should('be.visible').click().then(() => {
      expect(onSelectItemStub).to.be.calledOnceWith({ file: mockFile, item: { exportName: 'FooBar', isDefault: false } })
    })

    cy.contains('BarFoo').should('be.visible')
    cy.contains('FooBarBaz').should('be.visible')
  })
})
