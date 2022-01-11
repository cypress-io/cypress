describe('Launchpad: Setup Project', () => {
  before(() => {
    cy.scaffoldProject('pristine') // not configured
    cy.scaffoldProject('pristine-with-ct-testing') // not configured
    cy.scaffoldProject('pristine-with-e2e-testing') // e2e configured
  })

  const verifyWelcomePage = ({ e2eIsConfigured, ctIsConfigured }) => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('[data-cy-testingtype="e2e"]', e2eIsConfigured ? 'Configured' : 'Not Configured')
    cy.contains('[data-cy-testingtype="component"]', ctIsConfigured ? 'Configured' : 'Not Configured')
  }

  it('no initial setup displays welcome page', () => {
    cy.openProject('pristine')
    cy.visitLaunchpad()
    cy.contains('Welcome to Cypress!').should('be.visible')
    verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
  })

  describe('"learn about testing types" modal', () => {
    beforeEach(() => {
      cy.openProject('pristine')
      cy.visitLaunchpad()
      verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
    })

    it('welcome page has "learn about testing types" link which opens modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.contains('Need help?').should('be.visible')

      cy.get('[data-cy="end-to-end-comparison"]').within(() => {
        cy.contains('End-to-end Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })

      cy.get('[data-cy="component-comparison"]').within(() => {
        cy.contains('Component Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })
    })

    it('close modal with escape key', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by clicking outside of modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.get('body').click(5, 5)
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by clicking close button', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.get('h2').contains('Key Differences').should('be.visible')
      cy.get('[aria-label=Close]').click()
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it.skip('closes modal by pressing enter key when close button is focused', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('h2', 'Key Differences').should('be.visible')

      // @ts-ignore
      cy.get('body').tab()

      cy.get('[aria-label=Close]')
      .should('have.attr', 'type', 'button')
      .should('have.focus')
      .type('{enter}')

      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.contains('h2', 'Key Differences').should('not.be.visible')
    })

    it('clicking "Need Help?" links to Cypress documentation', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('h2', 'Key Differences').should('be.visible')
      cy.validateExternalLink({
        name: 'Need help?',
        href: 'https://on.cypress.io',
      })
    })
  })

  describe('E2E test setup', () => {
    // E2E Project Setup (Existing Project, Migrated, w/o E2E Configured)
    //   Running `cypress open --e2e` with no initial setup detected will launch into the project in e2e showing the first step in configuration
    //   When viewing the Launchpad Welcome View for a project without e2e configured (accessed either from "back" or "testing type switcher" flow), the e2e testing card on the project setup page shows a "Not configured" label
    //   Clicking on the e2e testing card of the project setup page will route the user to the Configuration Files page

    // e2e Configured Files (never having setup E2E before)
    //   Clicking on any of the configured files will display a preview of the code of the file.
    //   Clicking 'Continue' takes you to the 'Choose a Browser' page

    describe('project has been configured for e2e', () => {
      it('it skips the setup page when choosing e2e tests to run', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the browser pages when opened via cli with --e2e flag', () => {
        cy.scaffoldProject('pristine-with-e2e-testing')
        cy.openProject('pristine-with-e2e-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    // project has a cypress.configuration file with component testing configured
    describe('project that has not been configured for e2e', () => {
      it('shows the first step in configuration when selecting e2e tests', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()
        cy.findByText('We added the following files to your project.')
      })

      it('moves to "Choose a Browser" page after clicking "Continue" button in first step in configuration page', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        cy.contains('Welcome to Cypress!').should('be.visible')
        cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
        cy.contains('[data-cy-testingtype="component"]', 'Configured')

        cy.get('[data-cy-testingtype="e2e"]').click()
        cy.findByText('We added the following files to your project.')
        // cy.findByText('Continue').click()
        // cy.get('h1').should('contain', 'Choose a Browser')
      })

      it('shows the first step in configuration when opened via cli with --e2e flag', () => {
        cy.openProject('pristine-with-ct-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.contains('We added the following files to your project.')

        cy.wait(5000)
        cy.contains('We added the following files to your project.')
        // cy.get('body').tab()

        // cy.get('button')
        // .should('have.focus')
        // .contains('Continue')
        // .type('{enter}')

        // cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    it('can setup e2e testing for a project not been configured for cypress', () => {
      cy.openProject('pristine')
      cy.visitLaunchpad()

      verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

      // @ts-ignore
      cy.get('body').tab()

      cy.get('[data-cy-testingtype="e2e"]')
      .should('have.focus')
      .type('{enter}')

      // cy.wait(5000)

      cy.findByText('We added the following files to your project.')

      cy.wait(5000)
      cy.findByText('We added the following files to your project.')

      // cy.findByText('Continue').click()
      // cy.get('h1').should('contain', 'Choose a Browser')

      // cy.get('Back').click()
      // cy.contains('[data-cy-testingtype="e2e"]', 'Configured')

      // cy.openProject('pristine')
      // cy.visitLaunchpad()
      // cy.contains('[data-cy-testingtype="e2e"]', 'Configured')
    })
  })

  describe('Component setup', () => {
    describe('project has been configured for component testing', () => {
      it('it skips the setup page when choosing component tests to run', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the browser pages when opened via cli with --component flag', () => {
        cy.scaffoldProject('pristine-with-ct-testing')
        cy.openProject('pristine-with-ct-testing', ['--component'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    describe('project that has not been configured for e2e', () => {
      it('opens to the "choose framework" page when opened via cli with --component flag', () => {
        cy.scaffoldProject('pristine-with-e2e-testing')
        cy.openProject('pristine-with-e2e-testing', ['--component'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Project Setup')
        cy.contains('Confirm the front-end framework and bundler used in your project.')

        cy.wait(5000)
        cy.contains('Confirm the front-end framework and bundler used in your project.')
      })

      it('shows the "choose framework" page when selecting component tests', () => {
        cy.scaffoldProject('pristine-with-e2e-testing')
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.get('h1').should('contain', 'Project Setup')
        cy.contains('Confirm the front-end framework and bundler used in your project.')

        cy.wait(5000)
        cy.contains('Confirm the front-end framework and bundler used in your project.')
      })
    })

    describe('project not been configured for cypress', () => {
      it('can setup component testing for a project not been configured for cypress', () => {
        cy.scaffoldProject('pristine')
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.get('[data-cy-testingtype="component"]')
        .should('have.focus')
        .type('{enter}')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')
      })
    })

    // component Project Setup (never having setup CT before)
    // +   Running `cypress open --component` with no initial setup detected will launch into the project in component showing 'choose framework' page
    // +  Clicking on the component area of project setup will route the user to the page showing 'choose framework' page
    //   The choose framework page displays options to select framework, bundler, and language with JavaScript pre-selected and the 'Next' button disabled.
    //   On the 'choose framework' page, clicking 'back' returns you to the 'project setup' page to choose e2e or component
    //   The framework dropdown displays all frameworks supported by Cypress with their icon  (Create React App, Vue CLI, React.js, Vue.js, Next.js, Nuxt.js)
    //   The Bundler dropdown display all bundlers supported by Cypress with their icon (Webpack, Vite)
    //   Choosing each option on the 'choose framework' page shows the items in the dropdowns as selected and allows you to select the 'Next' button
    //   Clicking Next after selecting options on the 'choose framework' page takes you to the 'install dev dependecy' screen.

    // component Install Dev Dependencies
    //   After selecting framework, bundler, from previous project setup, 'install dev dependencies' page is displayed
    //   Clicking 'Back' on the 'install dev dependencies' page returns you to the 'choose framework' page
    //   The 'install dev dep' page has an area that displays the command to run to install the required packages
    //   Clicking 'copy' next to the command gives a visual indicator that the command was copied
    //   We detect what package manager (yarn, npm, pnpm) is being used and display the appropriate command
    //   Clicking 'copy' next to the command copies the command to the clipboard
    //   Below the command, there are n rows shown for each package displaying the package name and a description on what the package does
    //   Clicking 'Continue' routes you to the 'configured files' page.

    // component Configured files (never having setup e2e or CT before)
    //   Clicking on any of the configured files will display a preview of the code of the file.
    //   Clicking 'Continue' routes you to 'Choose a Browser' page
  })
})
