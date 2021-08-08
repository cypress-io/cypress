import { defaultMessages } from '../locales/i18n'
import GlobalPage from './GlobalPage.vue'

describe('<GlobalPage />', () => {
  it('renders the empty state', () => {
    cy.mount(() => (<div>
      <GlobalPage />
    </div>))
  })
})
