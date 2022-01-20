import ConfigCode from './ConfigCode.vue'
import config from '../../../../frontend-shared/cypress/fixtures/config.json'
import { defaultMessages } from '@cy/i18n'

const selector = '[data-testid=code]'

describe('<ConfigCode />', () => {
  beforeEach(() => {
    cy.mount(() => (<div class="p-12 overflow-auto">
      <ConfigCode data-testid="code" config={config as any} />
    </div>))
  })

  it('renders the code passed in', () => {
    cy.get(selector).should('contain.text', Object.keys(config)[0])
  })

  it('has an edit button', () => {
    cy.findByText(defaultMessages.file.edit).should('be.visible').click()
  })

  it('shows object values properly', () => {
    cy.contains(`'{`).should('not.exist')
  })
})
