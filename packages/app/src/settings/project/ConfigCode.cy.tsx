import ConfigCode from './ConfigCode.vue'
import config from '@packages/frontend-shared/cypress/fixtures/config.json'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
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
    it('shows empty object in one line', () => {
      cy.mount(() => (<div class="p-12 overflow-auto">
        <ConfigCode data-cy="code" gql={{
          id: 'project-id',
          configFile: 'cypress.config.js',
          configFileAbsolutePath: '/path/to/cypress.config.js',
          config: [{
            field: 'emptyObjectTest',
            value: {},
            from: 'plugin',
          }],
        }} />
      </div>))

      cy.contains(`emptyObjectTest:`).should('contain.text', '{},')
      cy.contains(`emptyObjectTest:`).within(($subject) => {
        cy.wrap($subject).get('br').should('have.length', 1)
      })
    })

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

    it('shows arrayTest tooltip on hover value', () => {
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

      Cypress._.each(arrayTest, (val) => {
        const valElement = cy.findByText(`'${val}',`)

        valElement.realHover()

        cy.get('.v-popper__popper--shown')
        .should('be.visible')
        .should('contain.text', 'plugin')
      })
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

      const expectedText = `{${Object.entries(objectTest).map(([key, value]) => `${key}: '${value}'`).join(', ')}, }`

      cy.contains(`objectTest:`).should('contain.text', expectedText)
    })

    it('shows objectTest tooltip on hover value', () => {
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

      Cypress._.each(Object.values(objectTest), (value) => {
        const valElement = cy.findByText(`'${value}',`)

        valElement.realHover()

        cy.get('.v-popper__popper--shown')
        .should('have.length', 1)
        .should('be.visible')
        .should('contain.text', 'env')
      })
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
      let lastEntry = ''
      let nesting = 0
      let checkedFieldCount = 0
      const configFields = config.map((entry) => entry.field)

      cy.get(selector).within(($selector) => {
        cy.get('span').each(($el: any) => {
          let configText = $el[0].innerText.split(':')[0]

          if (configText === '{') {
            nesting++
          } else if (configText === '}') {
            nesting--
          }

          if (nesting === 0 && configFields.includes(configText)) {
            expect(configText.localeCompare(lastEntry)).to.be.greaterThan(0)
            lastEntry = configText
            checkedFieldCount++
          }
        })
      })

      cy.then(() => expect(checkedFieldCount).to.eq(configFields.length))
    })

    it('has an edit button', () => {
      cy.findByText(defaultMessages.file.edit).should('be.visible').click()
    })

    it('shows object values properly', () => {
      cy.contains(`'{`).should('not.exist')
    })

    it('shows browser values properly', () => {
      const browserFieldValue = config.find((c) => c.field === 'browsers')?.value

      if (Array.isArray(browserFieldValue) && browserFieldValue.length) {
        browserFieldValue.forEach((browser) => {
          browser.name && cy.contains(`name: '${browser.name}',`)
          browser.family && cy.contains(`family: '${browser.family}',`)
          browser.channel && cy.contains(`channel: '${browser.channel}',`)
          browser.displayName && cy.contains(`displayName: '${browser.displayName}',`)
          browser.version && cy.contains(`version: '${browser.version}',`)
          browser.path && cy.contains(`path: '${browser.path}',`)
          browser.majorVersion && cy.contains(`majorVersion: ${browser.majorVersion},`)
        })
      } else {
        throw new Error('Missing browsers to render')
      }
    })
  })
})
