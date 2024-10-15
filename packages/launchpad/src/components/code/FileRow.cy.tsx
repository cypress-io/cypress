/* eslint-disable no-irregular-whitespace */
import FileRow from './FileRow.vue'
import { faker } from '@faker-js/faker'
import { defaultMessages } from '@cy/i18n'

const content = `import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
    indexHtmlFile: 'cypress/component/support/entry.html'
  },
})`

faker.seed(1)

const description = faker.hacker.phrase()
const messages = defaultMessages.setupPage.configFile

const changesRequiredDescription = messages.changesRequiredDescription.replace('{0}', '')

describe('FileRow', () => {
  it('renders each status, the expected files, and expected styles', () => {
    cy.mount(() => (
      <div class="w-full p-5">
        <FileRow
          status="valid"
          content={content}
          filePath="cypress/integration/support.ts"
          description={description}
          fileExtension=".ts"
        />
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description={description}
          fileExtension=".js"
        />
        <FileRow
          status="skipped"
          content={content}
          filePath="cypress.config.js"
          description={description}
          fileExtension=".js"
        />
        <FileRow
          status="error"
          content={content}
          filePath="cypress/integration/index.js"
          description={description}
          fileExtension=".js"
        />
        <FileRow
          status="valid"
          content={content}
          filePath="cypress/integration/function.ts"
          description={description}
          fileExtension=".ts"
        />
      </div>
    ))

    cy.get('pre.shiki').should('exist')

    cy.contains('cypress/integration/support.ts')
    cy.contains('cypress/integration/command.js')
    cy.contains('cypress.config.js')
    cy.contains('cypress/integration/index.js')
    cy.contains('cypress/integration/function.ts')

    cy.get('[data-cy=valid] [data-cy=collapsible-header]').each((element) => {
      cy.wrap(element).should('have.attr', 'aria-expanded', 'false')
    })

    cy.get('[data-cy=changes] [data-cy=collapsible-header]').each((element) => {
      cy.wrap(element).should('have.attr', 'aria-expanded', 'true')
    })

    cy.get('[data-cy=skipped] [data-cy=collapsible-header]').each((element) => {
      cy.wrap(element).should('have.attr', 'aria-expanded', 'false')
    })

    cy.get('[data-cy=error] [data-cy=collapsible-header]').each((element) => {
      cy.wrap(element).should('have.attr', 'aria-expanded', 'true')
    })

    cy.percySnapshot()
  })

  it('opens on click', () => {
    cy.mount(() => (
      <div class="w-full p-5">
        <FileRow
          status="valid"
          content={content}
          filePath="cypress/integration/support.js"
          description={description}
          fileExtension=".js"
        />
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description={description}
          fileExtension=".js"
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js')
    cy.contains(messages.changesRequiredLabel).should('be.visible')
    cy.get('[data-cy=changes-required-badge]').should('not.exist') // Hide badge when row is expanded
    cy.contains(changesRequiredDescription).should('be.visible')
    cy.get('pre').should('have.length', 2)

    cy.get('.shiki').should('be.visible')
    cy.contains('cypress/integration/command.js').click()

    cy.get('.shiki').should('not.be.visible')
  })

  it('responds nice to small screens', { viewportWidth: 500 }, () => {
    const lorem = faker.lorem.paragraphs(3)

    cy.mount(() => (
      <div class="w-full p-5">
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description={lorem}
          fileExtension=".js"
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js')
    cy.contains(messages.changesRequiredLabel).should('be.visible')
    cy.get('[data-cy=changes-required-badge]').should('not.exist')
    cy.contains(changesRequiredDescription).should('be.visible')
    cy.get('pre').should('exist')

    cy.percySnapshot()
  })
})
