import _ from 'lodash'
import StatusIndicator from './StatusIndicator.vue'

const types = {
  success: `Sweet`,
  error: `Ahhh!`,
  warning: `Hmmmm...`,
  disabled: `Nah`
}

const renderStatusIndicator = (status, text) => {
  return (<span class="inline text-center">{ status }<StatusIndicator class="inline" type={status}>{text}</StatusIndicator></span>)
}

describe('<StatusIndicator />', () => {
  it('renders all states', () => {
    cy.mount(() => (
      <div class="p-12">
        <h1 class="text-2xl pb-4">Status Indicators</h1>
        <div class="inline-flex gap-4">
          { _.map(types, (text, type) => renderStatusIndicator(type, text)) }
        </div>
      </div>
    ))

    _.forEach(types, (text) => {
      cy.findByText(text).should('be.visible')
    })
  })
})