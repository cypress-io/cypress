describe('NewSpec', () => {
  beforeEach(() => {
    cy.setupE2E('spec-generation')

    // Fails locally (cypress:open) unless I refresh browsers
    cy.withCtx(async (ctx) => {
      await ctx.actions.app.refreshBrowsers()
    })

    cy.initializeApp()

    cy.withCtx((ctx, { testState }) => {
      testState.generatedSpecs = {
        story: 'src/Button.stories.cy.jsx',
        storyCopy: 'src/Button.stories-copy-1.cy.jsx',
        component: 'src/Button.cy.jsx',
        componentCopy: 'src/Button-copy-1.cy.jsx',
        integration: 'cypress/integration/HelloWorld.spec.js',
        integrationCopy: 'cypress/integration/HelloWorld-copy-1.spec.js',
      }

      // Hack for `stop-only-all`
      testState.generatedSpecContent = {
        story: `import React from "react"
import { mount } from "@cypress/react"
import { composeStories } from "@storybook/testing-react"
import * as stories from "./Button.stories"

const composedStories = composeStories(stories)

describe('Button', () => {
  ${/** Hack for "stop-only-all" */'it'}.only('should render Primary', () => {
    const { Primary } = composedStories
    mount(<Primary />)
  })

  it('should render Secondary', () => {
    const { Secondary } = composedStories
    mount(<Secondary />)
  })

  it('should render Large', () => {
    const { Large } = composedStories
    mount(<Large />)
  })

  it('should render Small', () => {
    const { Small } = composedStories
    mount(<Small />)
  })
})`,
        component: `import { mount } from "@cypress/react"
import Button from "./Button"

describe('<Button />', () => {
  it('renders', () => {
    // see: https://reactjs.org/docs/test-utils.html
    mount(<Button />)
  })
})`,
        integration: `describe('HelloWorld.spec.js', () => {
  it('should visit', () => {
    cy.visit('/')
  })
})`,
      }
    })

    cy.withCtx((ctx, { testState }) => {
      const { fs, path, activeProject } = ctx
      const projectRoot = activeProject?.projectRoot as string

      for (const file of Object.values(testState.generatedSpecs) as string[]) {
        fs.removeSync(path.join(projectRoot, file))
      }
    })
  })

  it('generates a spec from story', () => {
    cy.visitApp('#/newspec')
    cy.wait(1000)
    cy.intercept('mutation-NewSpec_CodeGenSpec').as('codeGenSpec')

    cy.findByText('Generate From Story').should('not.be.disabled').click()

    cy.get('li').contains('Button.stories.jsx').as('codeGen').click()
    cy.wait('@codeGenSpec')

    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.relative).eq(testState.generatedSpecs.story)
      const fileContent = ctx.fs.readFileSync(
        generatedSpec?.spec.absolute as string,
        'utf-8',
      )

      expect(fileContent).eq(testState.generatedSpecContent.story)
    })

    // Test creating a copy
    cy.get('@codeGen').click()
    cy.wait('@codeGenSpec')

    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.relative).eq(
        testState.generatedSpecs.storyCopy,
      )

      ctx.fs.accessSync(
        generatedSpec?.spec.absolute as string,
        ctx.fs.constants.F_OK,
      )
    })
  })

  it('generates a component from story', () => {
    cy.visitApp('#/newspec')
    cy.wait(1000)
    cy.intercept('mutation-NewSpec_CodeGenSpec').as('codeGenSpec')

    cy.findByText('Generate From Component').click()

    cy.get('li').contains('Button.jsx').as('codeGen').click()
    cy.wait('@codeGenSpec')

    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.relative).eq(
        testState.generatedSpecs.component,
      )

      const fileContent = ctx.fs.readFileSync(
        generatedSpec?.spec.absolute as string,
        'utf-8',
      )

      expect(fileContent).eq(testState.generatedSpecContent.component)
    })

    // Test creating a copy
    cy.get('@codeGen').click()
    cy.wait('@codeGenSpec')

    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.relative).eq(
        testState.generatedSpecs.componentCopy,
      )

      ctx.fs.accessSync(
        generatedSpec?.spec.absolute as string,
        ctx.fs.constants.F_OK,
      )
    })
  })

  it('generates an integration spec', () => {
    cy.visitApp('#/newspec')
    cy.wait(1000)
    cy.intercept('mutation-NewSpec_CodeGenSpec').as('codeGenSpec')

    cy.findByText('Generate Integration').click()

    cy.get('#fileName').type('HelloWorld.spec.js')
    cy.findByText('Generate Spec').as('generateSpec').click()
    cy.wait('@codeGenSpec')

    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.relative).eq(
        testState.generatedSpecs.integration,
      )

      const fileContent = ctx.fs.readFileSync(
        generatedSpec?.spec.absolute as string,
        'utf-8',
      )

      expect(fileContent).eq(testState.generatedSpecContent.integration)
    })

    cy.get('@generateSpec').click()
    cy.wait('@codeGenSpec')

    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.relative).eq(
        testState.generatedSpecs.integrationCopy,
      )

      ctx.fs.accessSync(
        generatedSpec?.spec.absolute as string,
        ctx.fs.constants.F_OK,
      )
    })
  })
})
