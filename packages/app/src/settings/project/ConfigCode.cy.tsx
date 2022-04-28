import ConfigCode from './ConfigCode.vue'
import config from '@packages/frontend-shared/cypress/fixtures/config.json'
import { defaultMessages } from '@cy/i18n'

const selector = '[data-cy=code]'

const arrayTest = ['a', 'b', 'c']

const objectTest = {
  a: 'a-value',
  b: 'b-value',
  c: 'c-value',
}

describe('<ConfigCode />', () => {
  context('with mock values', () => {
    it('shows the arrayTest nicely', () => {
      cy.mount(() => (<div class="p-12 overflow-auto">
        <ConfigCode data-cy="code" gql={{
          id: 'project-id',
          configFile: 'cypress.config.js',
          configFileAbsolutePath: '/path/to/cypress.config.js',
          config: [{
            field: 'arrayTest',
            value: arrayTest,
            from: 'plugin',
          }],
        }} />
      </div>))

      cy.contains(`arrayTest:`).should('contain.text', `['${arrayTest.join('\', \'')}', ]`)
    })

    it('shows the objectTest nicely', () => {
      cy.mount(() => (<div class="p-12 overflow-auto">
        <ConfigCode data-cy="code" gql={{
          id: 'project-id',
          configFile: 'cypress.config.js',
          configFileAbsolutePath: '/path/to/cypress.config.js',
          config: [{
            field: 'objectTest',
            value: objectTest,
            from: 'env',
          }],
        }} />
      </div>))

      const expectedText = `{${Object.entries(objectTest).map(([key, value]) => `${key}: '${value}'`).join(',')},}`

      cy.contains(`objectTest:`).should('contain.text', expectedText)
    })
  })

  context('with real config file', () => {
    beforeEach(() => {
      cy.mount(() => (<div class="p-12 overflow-auto">
        <ConfigCode data-cy="code" gql={{
          id: 'project-id',
          configFile: 'cypress.config.js',
          configFileAbsolutePath: '/path/to/cypress.config.js',
          config,
        }} />
      </div>))
    })

    it('renders all the keys passed in', () => {
      cy.get(selector).then((obj) => {
        const objectText = obj.text()

        config.forEach((entry) => {
          expect(objectText).to.contain(entry.field)
        })
      })
    })

    it('sorts the config in alphabetical order', () => {
      let lastEntry: any = ''

      config.forEach((entry) => {
        expect(entry.field.localeCompare(lastEntry)).to.be.greaterThan(0)
        lastEntry = entry
      })
    })

    it('has an edit button', () => {
      cy.findByText(defaultMessages.file.edit).should('be.visible').click()
    })

    it('shows object values properly', () => {
      cy.contains(`'{`).should('not.exist')
    })

    it('shows browser values properly', () => {
      const browserFieldValue = config.find((c) => c.field === 'browsers')?.value
      const browserText = Array.isArray(browserFieldValue) ? browserFieldValue.map((b) => b.name).join(', ') : ''

      cy.contains(`browsers:`).should('contain.text', browserText)
    })
  })
})
