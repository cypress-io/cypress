import _ from 'lodash'
import StatusIndicator, { StatusIndicatorType } from './StatusIndicator.vue'

const types = {
  success: `Sweet`,
  error: `Ahhh!`,
  warning: `Hmmmm...`,
  disabled: `Nah`,
} as const

const renderStatusIndicator = (status: StatusIndicatorType, text: string) => {
  return (
    <span class="inline text-center">
      {status}
      <StatusIndicator
        class="inline"
        type={status}
      >
        {text}
      </StatusIndicator>
    </span>
  )
}

describe('<StatusIndicator />', () => {
  it('renders all states', () => {
    cy.mount(() => (
      <div class="p-12">
        <h1 class="text-2xl pb-4">Status Indicators</h1>
        <div class="inline-flex gap-4">
          {Object.entries(types).map(([text, type]) => renderStatusIndicator(text, type))}
        </div>
      </div>
    ))

    _.forEach(types, (text) => {
      cy.findByText(text).should('be.visible')
    })
  })
})
