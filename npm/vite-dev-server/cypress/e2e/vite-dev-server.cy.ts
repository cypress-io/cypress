/// <reference path="../support/e2e.ts" />

import dedent from 'dedent'

describe('Config options', () => {
  it('works with tailwind', () => {
    cy.scaffoldProject('tailwind-vite')
    cy.openProject('tailwind-vite', ['--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 1)
    cy.withCtx(async (ctx) => {
      // Add a new spec with bg-blue-100 that asserts the style is correct
      // If HMR + Tailwind is working properly, it'll pass.
      await ctx.actions.file.writeFileInProject(
        'src/App.cy.jsx', `
        import React from 'react'
        import { mount } from 'cypress/react'

        export const App = () => {
          return (
            <div className='bg-blue-100' id='hello'>
              Hello
            </div>
          )
        }

        it('works', () => {
          mount(<App />)
          cy.get('#hello').should('have.css', 'background-color', 'rgb(219, 234, 254)')
        })

        it('dummy', () => {})
        `,
      )
    })

    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 2)
  })

  it('supports supportFile = false', () => {
    cy.scaffoldProject('vite6.0.0-react')
    cy.openProject('vite6.0.0-react', ['--config-file', 'cypress-vite-no-support.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    // no support file means there is no mount function registered, so all tests should fail
    cy.get('.failed > .num').should('contain', 2)
  })

  it('supports serving files with whitespace', () => {
    const specWithWhitespace = 'spec with whitespace.cy.jsx'

    cy.scaffoldProject('vite6.0.0-react')
    cy.openProject('vite6.0.0-react', ['--config-file', 'cypress-vite.config.ts', '--component'])
    cy.startAppServer('component')

    cy.withCtx(async (ctx, { specWithWhitespace }) => {
      await ctx.actions.file.writeFileInProject(
        ctx.path.join('src', specWithWhitespace),
        await ctx.file.readFileInProject(ctx.path.join('src', 'App.cy.jsx')),
      )
    }, { specWithWhitespace })

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains(specWithWhitespace).click()
    cy.get('.passed > .num').should('contain', 2)
  })

  it('supports @cypress/vite-dev-server', () => {
    cy.scaffoldProject('vite6.0.0-react')
    cy.openProject('vite6.0.0-react', ['--config-file', 'cypress-vite-dev-server-function.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 2)
  })

  it('supports viteConfig as an async function', () => {
    cy.scaffoldProject('vite6.0.0-react')
    cy.openProject('vite6.0.0-react', ['--config-file', 'cypress-vite-async-function-config.config.ts', '--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.contains('App.cy.jsx').click()
    cy.waitForSpecToFinish()
    cy.get('.passed > .num').should('contain', 2)
    cy.withCtx(async (ctx) => {
      const verifyFile = await ctx.file.readFileInProject('wrote-to-file')

      expect(verifyFile).to.eq('OK')
    })
  })
})

describe('sourcemaps', () => {
  it('should be provided for JS and transpiled files', () => {
    const testContent = dedent`
      describe('spec file with import', () => {
        it('should generate uncaught error', () => {
          throw new Error('uncaught')
        })
      
        it('should generate failed command', () => {
          cy.get('#does-not-exist', { timeout: 100 })
        })
      })
    `

    cy.scaffoldProject('vite6.0.0-react')
    cy.openProject('vite6.0.0-react', ['--config-file', 'cypress-vite.config.ts', '--component'])
    cy.startAppServer('component')

    cy.withCtx(async (ctx, o) => {
      await ctx.actions.file.writeFileInProject(
        'JsErrorSpec.cy.js',
        o.testContent,
      )

      await ctx.actions.file.writeFileInProject(
        'JsWithImportErrorSpec.cy.js',
        `import React from 'react';\n\n${o.testContent}`,
      )

      await ctx.actions.file.writeFileInProject(
        'JsxErrorSpec.cy.jsx',
        o.testContent,
      )

      await ctx.actions.file.writeFileInProject(
        'TsErrorSpec.cy.ts',
        `type MyType = { value: string }\n\n${o.testContent}`,
      )

      await ctx.actions.file.writeFileInProject(
        'TsxErrorSpec.cy.tsx',
        `type MyType = { value: string }\n\n${o.testContent}`,
      )
    }, { testContent })

    const verifySourcemap = (specName: string, line: number, column: number) => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains(specName).click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 2)
      cy.get('.runnable-err-file-path', { timeout: 250 }).should('contain', `${specName}:${line}:${column}`)
    }

    verifySourcemap('JsErrorSpec.cy.js', 7, 8)

    verifySourcemap('JsWithImportErrorSpec.cy.js', 9, 8)

    verifySourcemap('JsxErrorSpec.cy.jsx', 7, 8)

    verifySourcemap('TsErrorSpec.cy.ts', 9, 8)

    verifySourcemap('TsxErrorSpec.cy.tsx', 9, 8)
  })
})
