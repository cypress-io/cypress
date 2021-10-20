/* eslint-disable no-irregular-whitespace */
import FileRow from './FileRow.vue'

const content = `import { defineConfig } from ’cypress'
import { devServer, defineDevServerConfig } from ’@cypress/vite-dev-server’

export default defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      entryHtmlFile: 'cypress/component/support/entry.html'
    }),
  },
})`

describe('FileRow', () => {
  it('renders each status', () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="valid"
          content={content}
          filePath="cypress/integration/support.ts"
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description="Aenean lacinia bibendum nulla sed consectetur."
        />
        <FileRow
          status="skipped"
          content={content}
          filePath="cypress.config.js"
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="error"
          content={content}
          filePath="cypress/integration/index.js"
          description="Lorem ipsum dolor sit"
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
          description="Lorem ipsum dolor sit"
        />
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description="Lorem ipsum dolor sit"
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js')
    cy.contains('Changes required').should('exist')
    cy.get('pre').should('exist')
    cy.contains('cypress/integration/command.js').click()
    cy.get('pre').should('not.exist')
  })

  it('responds nice to small screens', { viewportWidth: 500 }, () => {
    cy.mount(() => (
      <div class="p-5 w-full">
        <FileRow
          status="changes"
          content={content}
          filePath="cypress/integration/command.js"
          description="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laboriosam at temporibus nulla ratione a nam inventore esse facere vel nemo est veniam dolore, ullam fuga quidem, cum dolor quibusdam officiis."
        />
      </div>
    ))

    cy.contains('cypress/integration/command.js')
    cy.contains('Changes required').should('exist')
    cy.get('pre').should('exist')
  })
})
