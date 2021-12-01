import CoffeeIcon from '~icons/mdi/coffee'
import LoadingIcon from '~icons/mdi/loading'
import faker from 'faker'
import Alert, { AlertType } from './Alert.vue'
import { defaultMessages } from '../locales/i18n'
import Select from '@cy/components/Select.vue'

const messages = defaultMessages.components.alert

const alertBodySelector = '[data-testid=alert-body]'
const alertHeaderSelector = '[data-testid=alert-header]'

const suffixIconSelector = '[data-testid=alert-suffix-icon]'
const prefixIconSelector = '[data-testid=alert-prefix-icon]'

// This divider should eventually be tested inside of a visual regression test.
const dividerLineSelector = '[data-testid=alert-body-divider]'
const dismissSelector = `[aria-label=${messages.dismissAriaLabel}]`

const alertTitle = faker.hacker.phrase()
const alertBodyContent = faker.lorem.sentences(2)

const prefixIcon = () => <CoffeeIcon data-testid="coffee-icon"/>
const suffixIcon = () => <LoadingIcon data-testid="loading-icon" class="animate-spin"/>

describe('<Alert />', () => {
  describe('classes', () => {
    it('can change the text and background color for the alert', () => {
      cy.mount(() => <Alert headerClass="underline text-pink-500" alertClass="bg-pink-100" icon={suffixIcon}/>)
    })
  })

  describe('prefix', () => {
    it('renders the icon prop as a prefix', () => {
      cy.mount(() => <Alert status="info" icon={CoffeeIcon} />)
      .get(prefixIconSelector).should('be.visible')
    })

    it('renders the prefixIcon slot', () => {
      cy.mount(() => <Alert v-slots={{ prefixIcon }} />)
      .get('[data-testid=coffee-icon]').should('be.visible')
    })

    it('renders the prefixIcon slot even when an icon is passed in', () => {
      cy.mount(() => (<Alert
        v-slots={{ prefixIcon }}
        icon={() => <LoadingIcon data-testid="loading-icon" />}
      />))
      .get('[data-testid=coffee-icon]').should('be.visible')
      .get('[data-testid=loading-icon]').should('not.exist')
    })
  })

  describe('suffix', () => {
    it('renders the suffixIcon slot', () => {
      cy.mount(() => <Alert v-slots={{ suffixIcon }} />)
      .get('[data-testid=loading-icon]').should('be.visible')
    })
  })

  describe('static', () => {
    it('renders any body content and is open by default', () => {
      cy.mount(() => (
        <div class="p-4 text-center space-y-2">
          <Alert type="static">
            <p data-testid="body-content">{ faker.lorem.paragraphs(5) }</p>
          </Alert>
        </div>
      ))

      cy.get('[data-testid=body-content]').should('be.visible')
    })
  })

  describe('dismissible', () => {
    it('renders any body content and is open by default', () => {
      cy.mount(() => (
        <div class="p-4 text-center space-y-2">
          <Alert type="dismissible">
            <p data-testid="body-content">{ faker.lorem.paragraphs(5) }</p>
          </Alert>
        </div>
      ))

      cy.get('[data-testid=body-content]').should('be.visible')
    })

    it('cannot be collapsed', () => {
      cy.mount(() => (<Alert type="dismissible">
        <p data-testid="body-content">{ faker.lorem.paragraphs(5) }</p>
      </Alert>))
      .get(alertBodySelector).should('be.visible')
      .get(alertHeaderSelector).click()
      .get(alertBodySelector).should('be.visible')
    })

    it('has a "dismiss" suffixIcon by default', () => {
      cy.mount(() => (
        <div class="p-4 text-center space-y-2">
          <Alert status="info" type="dismissible"/>
        </div>
      ))

      cy.get(suffixIconSelector)
      .should('be.visible')
      .and('have.attr', 'aria-label', messages.dismissAriaLabel)
    })

    it('can be dismissed', () => {
      cy.mount(() => (
        <div class="p-4 text-center space-y-2">
          <Alert type="dismissible" />
        </div>
      ))

      cy.get(suffixIconSelector).focus().click()
      .get(alertHeaderSelector).should('not.exist')
    })

    it('accepts a custom dismiss icon, via slot', () => {
      cy.mount(() => <Alert type="dismissible" v-slots={{ suffixIcon }}/>)
    })

    it('can create a dismiss button via the suffixIcons slot props', () => {
      const slots = {
        suffixIcon ({ onClick, ariaLabel }) {
          return <CoffeeIcon onClick={onClick} aria-label={ariaLabel}/>
        },
      }

      cy.mount(() => <Alert type="dismissible" v-slots={slots} />)
      cy.get(dismissSelector).click()
      cy.get(alertHeaderSelector).should('not.exist')
    })
  })

  describe('with body content', () => {
    it('shows the body content initially', () => {
      const types: AlertType[] = ['dismissible', 'static']

      const alerts = types.map((type) => (<div>
        <h2 class="capitalize">{type}</h2>
        <Alert type={type} title={alertTitle}>
          <p>{ faker.lorem.paragraphs(2) }</p>
        </Alert>
      </div>
      ))

      cy.mount(() => <div class="p-4 space-y-2">{ alerts }</div>)
      cy.get(alertBodySelector).each((el) => cy.wrap(el).should('be.visible').get(dividerLineSelector).should('be.visible'))
    })
  })

  describe('without body content', () => {
    it('cannot be collapsed, even when the alert type is collapsible', () => {
      cy.mount(<Alert type="collapsible" title={alertTitle}/>)
      cy.get(alertBodySelector).should('not.exist')
      cy.get(alertHeaderSelector).click().get(alertBodySelector).should('not.exist')
    })

    it('renders each alert type without the divider line', () => {
      const types: AlertType[] = ['collapsible', 'dismissible', 'static']

      const alerts = types.map((type) => (<div>
        <h2 class="capitalize">{type}</h2>
        <Alert type={type} title={alertTitle}/>
      </div>
      ))

      cy.mount(() => <div class="p-4 space-y-2">{ alerts }</div>)
      cy.get(alertHeaderSelector).each((el) => cy.wrap(el).click()).get(dividerLineSelector).should('not.exist')
    })
  })

  describe('collapsible', () => {
    beforeEach(() => {
      cy.mount(() => (
        <div class="p-4 text-center space-y-2">
          <Alert status="success" type="collapsible" icon={CoffeeIcon} title={alertTitle}>{alertBodyContent}</Alert>
        </div>
      ))
    })

    it('should not have a suffix icon', () => {
      cy.get(suffixIconSelector).should('not.exist')
      cy.get(dismissSelector).should('not.exist')
    })

    it('renders the alert title', () => {
      cy.get(alertHeaderSelector).should('be.visible').and('have.text', alertTitle)
    })

    it('the body content is collapsed by default', () => {
      cy.get(alertBodySelector).should('not.exist')
    })

    it('can be expanded and collapsed to show the body content', () => {
      cy.get(alertHeaderSelector).click()
      cy.get(alertBodySelector).should('be.visible').and('have.text', alertBodyContent)
      cy.get(alertHeaderSelector).click()
      cy.get(alertBodySelector).should('not.exist')
    })
  })
})

describe('playground', () => {
  it('renders', () => {
    cy.mount(() => (
      <div class="p-4 text-center space-y-2">
        <Select/>
        <hr/>
        <Alert status="success" type="collapsible" icon={CoffeeIcon} title="Coffee, please">
          Delicious. Yum.
          <button class="px-2 ml-2 bg-white rounded">Focusable</button>
        </Alert>
        <Alert status="info" type="collapsible" title="An info alert">Just letting you know what's up.</Alert>
        <Alert status="warning" type="static">Nothing good is happening here!</Alert>
        <Alert icon={CoffeeIcon} type="dismissible" status="error">Close me, please!</Alert>
        <Alert v-slots={{ suffixIcon }} type="collapsible" status="default">A notice.</Alert>
      </div>
    ))
  })
})
