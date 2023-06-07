import GeneratorSuccess from './GeneratorSuccess.vue'
import data from '../../../cypress/fixtures/GeneratorSuccess.json'
import type { FileListItemFragment } from '../../generated/graphql-test'

const targetSelector = '[data-cy=file-row]'
const spec = data[0] as FileListItemFragment
const content = `
import ${spec.baseName} from './${spec.baseName}'
import { mount } from '@cypress/react'

describe('<${spec.baseName} />', () => {
  it('renders', () => {
    // https://on.cypress.io/mount
    mount(<${spec.baseName} />)
  }) 
})
`.trim()

describe('<GeneratorSuccess />', () => {
  it('renders the relative file path', () => {
    cy.mount(() => (<GeneratorSuccess file={{ ...spec, contents: content }} />))
    .get('body')
    .contains(spec.relative)
  })

  it('can be collapsed to hide the content', () => {
    cy.mount(() => (<GeneratorSuccess file={{ ...spec, contents: content }} />))
    .get(targetSelector)
    .click()
    .get('code .line')
    .should('not.be.visible')
    .wait(200) // just to show off the animation
    .get(targetSelector)
    .click()
    .get('code .line')
    .should('be.visible')
    .should('have.length', content.split('\n').length)
  })

  it('handles really long file names and really long content', () => {
    const relative = 'src/components/deep/nested/path/to/deep/nested/path/to/component/MyComponent/MyComponent.spec.tsx'
    const longContent = Object.keys(Array.from(Array(100))).map((c) => content).join('\n')

    cy.mount(() => (<GeneratorSuccess file={{ ...spec, relative, contents: longContent }} />))
    cy.percySnapshot()
  })

  it('does not render a copy button', () => {
    cy.mount(() => (<GeneratorSuccess file={{ ...spec, contents: content }} />))
    .get('body')
    .findByTestId('copy-button').should('not.exist')
  })
})
