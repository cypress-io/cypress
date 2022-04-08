import _ from 'lodash'
import type { StatusIndicatorType } from './StatusIndicator.vue'
import StatusIndicator from './StatusIndicator.vue'

const types = {
  success: `Sweet`,
  error: `Ahhh!`,
  warning: `Hmmmm...`,
  disabled: `Nah`,
} as const

const renderStatusIndicator = (text: string, status: StatusIndicatorType) => {
  return (
    <span class="text-center inline">
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
        <h1 class="pb-4 text-2xl">Status Indicators</h1>
        <div class="gap-4 inline-flex">
          {Object.entries(types).map(([type, text]) => renderStatusIndicator(text, type as StatusIndicatorType))}
        </div>
      </div>
    ))

    _.forEach(types, (text) => {
      cy.findByText(text).should('be.visible')
    })
  })
})
