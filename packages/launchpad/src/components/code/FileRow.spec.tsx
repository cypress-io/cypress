/* eslint-disable no-irregular-whitespace */
import FileRow from './FileRow.vue'
import faker from 'faker'
import { defaultMessages } from '@cy/i18n'

const content = `import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

export default defineConfig({
  component: {
    devServer,
    devServerConfig: {
      entryHtmlFile: 'cypress/component/support/entry.html'
    },
  },
})`

const description = faker.hacker.phrase()
const messages = defaultMessages.setupPage.configFile

const changesRequiredDescription = messages.changesRequiredDescription.replace('{0}', '')

describe('FileRow', () => {
  it('renders each status', () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="valid"
          content={content}
          filePath="cypress/integration/support.ts"
          description={description}
        />
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description={description}
        />
        <FileRow
          status="skipped"
          content={content}
          filePath="cypress.config.js"
          description={description}
        />
        <FileRow
          status="error"
          content={content}
          filePath="cypress/integration/index.js"
          description={description}
        />
      </div>
    ))
  })

  it('opens on click', () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="valid"
          content={content}
          filePath="cypress/integration/support.js"
          description={description}
        />
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description={description}
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js')
    cy.contains(messages.changesRequiredLabel).should('be.visible')
    cy.contains(messages.changesRequiredBadge).should('not.exist') // Hide badge when row is expanded
    cy.contains(changesRequiredDescription).should('be.visible')
    cy.get('pre').should('have.length', 2)
    cy.contains('cypress/integration/command.js').click()
  })

  it('responds nice to small screens', { viewportWidth: 500 }, () => {
    const lorem = faker.lorem.paragraphs(3)

    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description={lorem}
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js')
    cy.contains(messages.changesRequiredLabel).should('be.visible')
    cy.contains(messages.changesRequiredBadge).should('not.exist')
    cy.contains(changesRequiredDescription).should('be.visible')
    cy.get('pre').should('exist')
  })
})
