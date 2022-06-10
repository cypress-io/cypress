/// <reference path="../support/e2e.ts" />

describe('CJS ESM', () => {
  context('js', () => {
    context('cjs', () => {
      it('should load', () => {
        cy.scaffoldProject('react-webpack-cjs')
        cy.openProject('react-webpack-cjs')
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with import of webpack.config.js', () => {
        cy.scaffoldProject('react-webpack-cjs')
        cy.openProject('react-webpack-cjs', ['--config-file', 'cypress-webpack-import.config.js'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server', () => {
        cy.scaffoldProject('react-webpack-cjs')
        cy.openProject('react-webpack-cjs', ['--config-file', 'cypress-custom-dev-server.config.js'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server with import of webpack.config.js', () => {
        cy.scaffoldProject('react-webpack-cjs')
        cy.openProject('react-webpack-cjs', ['--config-file', 'cypress-custom-dev-server-webpack-import.config.js'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })
    })

    context('esm', () => {
      it('should load', () => {
        cy.scaffoldProject('react-webpack-esm')
        cy.openProject('react-webpack-esm')
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with import of webpack.config.js', () => {
        cy.scaffoldProject('react-webpack-esm')
        cy.openProject('react-webpack-esm', ['--config-file', 'cypress-webpack-import.config.js'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server', () => {
        cy.scaffoldProject('react-webpack-esm')
        cy.openProject('react-webpack-esm', ['--config-file', 'cypress-custom-dev-server.config.js'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server with import of webpack.config.js', () => {
        cy.scaffoldProject('react-webpack-esm')
        cy.openProject('react-webpack-esm', ['--config-file', 'cypress-custom-dev-server-webpack-import.config.js'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })
    })
  })

  context('ts', () => {
    context('cjs', () => {
      it('should load', () => {
        cy.scaffoldProject('react-webpack-ts-cjs')
        cy.openProject('react-webpack-ts-cjs')
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with import of webpack.config.ts', () => {
        cy.scaffoldProject('react-webpack-ts-cjs')
        cy.openProject('react-webpack-ts-cjs', ['--config-file', 'cypress-webpack-import.config.ts'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server', () => {
        cy.scaffoldProject('react-webpack-ts-cjs')
        cy.openProject('react-webpack-ts-cjs', ['--config-file', 'cypress-custom-dev-server.config.ts'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server with import of webpack.config.js', () => {
        cy.scaffoldProject('react-webpack-ts-cjs')
        cy.openProject('react-webpack-ts-cjs', ['--config-file', 'cypress-custom-dev-server-webpack-import.config.ts'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })
    })

    context('esm', () => {
      it('should load', () => {
        cy.scaffoldProject('react-webpack-ts-esm')
        cy.openProject('react-webpack-ts-esm')
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with import of webpack.config.ts', () => {
        cy.scaffoldProject('react-webpack-ts-esm')
        cy.openProject('react-webpack-ts-esm', ['--config-file', 'cypress-webpack-import.config.ts'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server', () => {
        cy.scaffoldProject('react-webpack-ts-esm')
        cy.openProject('react-webpack-ts-esm', ['--config-file', 'cypress-custom-dev-server.config.ts'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })

      it('should load with custom dev-server with import of webpack.config.js', () => {
        cy.scaffoldProject('react-webpack-ts-esm')
        cy.openProject('react-webpack-ts-esm', ['--config-file', 'cypress-custom-dev-server-webpack-import.config.ts'])
        cy.startAppServer('component')

        cy.visitApp()
        cy.contains('App.cy').click()
        cy.waitForSpecToFinish()
        cy.get('.passed > .num').should('contain', 1)
      })
    })
  })
})
