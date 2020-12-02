const { _ } = Cypress
const { each, flow, get, isString, join, map, merge, set, sortBy, toPairs } = require('lodash/fp')

describe('Settings', () => {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('projects').as('projects')
    cy.fixture('projects_statuses').as('projectStatuses')
    cy.fixture('specs').as('specs')
    cy.fixture('runs').as('runs')
    cy.fixture('keys').as('keys')

    this.goToSettings = () => {
      cy.get('.navbar-default')
      cy.get('a').contains('Settings').click()
      // make sure the common sections are shown
      cy.get('.settings-config')
      cy.get('.settings-proxy')
    }

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'closeBrowser').resolves()
      cy.stub(this.ipc, 'closeProject').resolves()
      cy.stub(this.ipc, 'pingApiServer').resolves()
      cy.stub(this.ipc, 'onConfigChanged')
      cy.stub(this.ipc, 'onFocusTests')
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'setClipboardText')

      this.openProject = this.util.deferred()
      cy.stub(this.ipc, 'openProject').returns(this.openProject.promise)

      this.getProjectStatus = this.util.deferred()
      cy.stub(this.ipc, 'getProjectStatus').returns(this.getProjectStatus.promise)

      this.getRecordKeys = this.util.deferred()
      cy.stub(this.ipc, 'getRecordKeys').returns(this.getRecordKeys.promise)

      start()
    })
  })

  describe('general functionality', () => {
    beforeEach(function () {
      this.openProject.resolve(this.config)
      this.projectStatuses[0].id = this.config.projectId
      this.getProjectStatus.resolve(this.projectStatuses[0])

      this.goToSettings()
    })

    it('navigates to settings page', () => {
      cy.contains('Configuration')
    })

    it('highlight settings nav', () => {
      cy.contains('a', 'Settings').should('have.class', 'active')
    })

    it('collapses panels by default', function () {
      cy.contains('Your project\'s configuration is displayed').should('not.exist')
      cy.contains('Record Keys allow you to').should('not.exist')
      cy.contains(this.config.projectId).should('not.exist')
      cy.percySnapshot()
    })

    context('on:focus:tests clicked', () => {
      beforeEach(function () {
        this.ipc.onFocusTests.yield()
      })

      it('routes to specs page', () => {
        cy.shouldBeOnProjectSpecs()
      })
    })
  })

  /**
   * Opens "Configuration" panel of the Settings tab
   * and checks that configuration element is fully visible.
   * This helps to ensure no flake down the line
   */
  const openConfiguration = () => {
    cy.contains('Configuration').click()
    cy.get('.config-vars').should('be.visible')
    .invoke('height').should('be.gt', 400)
  }

  describe('configuration panel', () => {
    describe('displays config', () => {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.projectStatuses[0].id = this.config.projectId
        this.getProjectStatus.resolve(this.projectStatuses[0])

        this.goToSettings()
        openConfiguration()
      })

      it('displays config section', () => {
        cy.contains('Your project\'s configuration is displayed')
      })

      it('displays browser information which is collapsed by default', () => {
        cy.contains('.config-vars', 'browsers')
        cy.get('.config-vars').invoke('text')
        .should('not.contain', '0:Chrome')

        cy.contains('span', 'browsers').parents('div').first().find('span').first().click()

        cy.get('.config-vars').invoke('text')
        .should('contain', '0:Chrome')

        // make sure the main collapsible content
        // has finished animating and that it has
        // an empty inline style attribute
        cy.get('.rc-collapse-content')
        .should('not.have.class', 'rc-collapse-anim')
        .should('have.attr', 'style', '')

        cy.percySnapshot()
      })

      it('removes the summary list of values once a key is expanded', () => {
        cy.contains('span', 'browsers').parents('div').first().find('span').first().click()
        cy.get('.config-vars').invoke('text')
        .should('not.contain', 'Chrome, Chromium')

        cy.get('.config-vars').invoke('text')
        .should('contain', '0:Chrome')
      })

      it('distinguishes between Arrays and Objects when expanded', () => {
        cy.get('.config-vars').invoke('text')
        .should('not.contain', 'browsers: Array (4)')

        cy.contains('span', 'browsers').parents('div').first().find('span').first().click()
        cy.get('.config-vars').invoke('text')
        .should('contain', 'browsers: Array (4)')
      })

      it('applies the same color treatment to expanded key values as the root key', () => {
        cy.contains('span', 'browsers').parents('div').first().find('span').first().click()
        cy.get('.config-vars').as('config-vars')
        .contains('span', 'Chrome').parent('span').should('have.class', 'plugin')

        cy.get('@config-vars')
        .contains('span', 'Chromium').parent('span').should('have.class', 'plugin')

        cy.get('@config-vars')
        .contains('span', 'Canary').parent('span').should('have.class', 'plugin')

        cy.get('@config-vars')
        .contains('span', 'Electron').parent('span').should('have.class', 'plugin')

        cy.contains('span', 'blockHosts').parents('div').first().find('span').first().click()
        cy.get('@config-vars')
        .contains('span', 'www.google-analytics.com').parent('span').should('have.class', 'config')

        cy.get('@config-vars')
        .contains('span', 'hotjar.com').parent('span').should('have.class', 'config')

        cy.contains('span', 'hosts').parents('div').first().find('span').first().click()
        cy.get('@config-vars')
        .contains('span', '127.0.0.1').parent('span').should('have.class', 'config')

        cy.get('@config-vars')
        .contains('span', '127.0.0.2').parent('span').should('have.class', 'config')

        cy.get('@config-vars')
        .contains('span', 'Electron').parents('div').first().find('span').first().click()

        cy.get('@config-vars').contains('span', 'electron').parents('li').eq(1).find('.line .plugin').should('have.length', 6)
      })

      it('displays string values as quoted strings', () => {
        cy.get('.config-vars').invoke('text')
        .should('contain', 'baseUrl:"http://localhost:8080"')
      })

      it('displays undefined and null without quotations', () => {
        cy.get('.config-vars').invoke('text')
        .should('not.contain', '"undefined"')
        .should('not.contain', '"null"')
      })

      it('does not show the root config label', () => {
        cy.get('.config-vars').find('> ol > li > div').should('have.css', 'display', 'none')
      })

      it('displays legend in table', () => {
        cy.get('table>tbody>tr').should('have.length', 6)
      })

      it('displays "true" values', () => {
        cy.get('.line').contains('true')
      })

      it('displays "null" values', () => {
        cy.get('.line').contains('null')
      })

      it('displays "object" values for env and hosts', () => {
        cy.get('.line').contains('www.google-analytics.com, hotjar.com')

        cy.get('.line').contains('*.foobar.com, *.bazqux.com')
      })

      it('displays "array" values for blockHosts', () => {
        cy.contains('.line', 'blockHosts').contains('www.google-analytics.com, hotjar.com')
      })

      it('opens help link on click', () => {
        cy.get('.settings-config .learn-more').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/guides/configuration')
        })
      })

      it('displays null when env settings are empty or not defined', function () {
        this.ipc.openProject.resolves(setConfigEnv(this.config, undefined))
        this.ipc.onConfigChanged.yield()

        cy.contains('.line', 'env:null').then(() => {
          this.ipc.openProject.resolves(this.config)
          this.ipc.onConfigChanged.yield()

          cy.contains('.line', 'env:fileServerFolder')
          .then(() => {
            this.ipc.openProject.resolves(setConfigEnv(this.config, null))
            this.ipc.onConfigChanged.yield()
            cy.contains('.line', 'env:null').then(() => {
              this.ipc.openProject.resolves(this.config)
              this.ipc.onConfigChanged.yield()

              cy.contains('.line', 'env:fileServerFolder')
              .then(() => {
                this.ipc.openProject.resolves(setConfigEnv(this.config, {}))
                this.ipc.onConfigChanged.yield()
                cy.contains('.line', 'env:null')
              })
            })
          })
        })
      })

      it('displays env settings', () => {
        cy.get('@config').then(({ resolved }) => {
          const getEnvKeys = flow([
            get('env'),
            toPairs,
            map(([key]) => key),
            sortBy(get('')),
          ])

          const assertKeyExists = each((key) => cy.contains('.line', key))
          const assertKeyValuesExists = flow([
            map((key) => {
              return flow([
                get(['env', key, 'value']),
                (v) => {
                  if (isString(v)) {
                    return `"${v}"`
                  }

                  return v
                },
              ])(resolved)
            }),
            each((v) => {
              cy.contains('.key-value-pair-value', v)
            }),
          ])

          const assertFromTooltipsExist = flow([
            map((key) => {
              return [key,
                flow([
                  get(['env', key, 'from']),
                  (from) => `.${from}`,
                ])(resolved)]
            }),
            each(([key, fromTooltipClassName]) => {
              cy.contains(key).parents('.line').first().find(fromTooltipClassName)
            }),
          ])

          cy.contains('.line', 'env').contains(flow([getEnvKeys, join(', ')])(resolved))
          cy.contains('.line', 'env').click()
          flow([getEnvKeys, assertKeyExists])(resolved)
          flow([getEnvKeys, assertKeyValuesExists])(resolved)
          flow([getEnvKeys, assertFromTooltipsExist])(resolved)
        })
      })
    })

    context('on config changes', () => {
      beforeEach(function () {
        this.projectStatuses[0].id = this.config.projectId
        this.getProjectStatus.resolve(this.projectStatuses[0])
        const newConfig = this.util.deepClone(this.config)

        newConfig.clientUrl = 'http://localhost:8888'
        newConfig.clientUrlDisplay = 'http://localhost:8888'
        newConfig.browsers = this.browsers
        this.openProject.resolve(newConfig)

        this.goToSettings()

        openConfiguration()
      })

      it('displays updated config', function () {
        const newConfig = this.util.deepClone(this.config)

        newConfig.resolved.baseUrl.value = 'http://localhost:7777'
        this.ipc.openProject.onCall(1).resolves(newConfig)
        this.ipc.onConfigChanged.yield()

        cy.contains('http://localhost:7777')
      })
    })

    context('when configFile is false', () => {
      beforeEach(function () {
        this.openProject.resolve(Cypress._.assign({
          configFile: false,
        }, this.config))

        this.goToSettings()

        openConfiguration()
      })

      it('notes that cypress.json is disabled', () => {
        cy.contains('set from cypress.json file (currently disabled by --config-file false)')
      })
    })

    context('when configFile is set', function () {
      beforeEach(function () {
        this.openProject.resolve(Cypress._.assign({
          configFile: 'special-cypress.json',
        }, this.config))

        this.goToSettings()

        openConfiguration()
      })

      it('notes that a custom config is in use', () => {
        cy.contains('set from custom config file special-cypress.json')
      })
    })
  })

  describe('project id panel', () => {
    beforeEach(function () {
      this.openProject.resolve(this.config)
      this.projectStatuses[0].id = this.config.projectId
      this.getProjectStatus.resolve(this.projectStatuses[0])

      this.goToSettings()
      cy.contains('Project ID').click()
    })

    it('displays project id section', function () {
      cy.contains(this.config.projectId)
      cy.percySnapshot()
    })

    it('shows tooltip on hover of copy to clipboard', () => {
      cy.get('.action-copy').trigger('mouseover')
      cy.get('.cy-tooltip').should('contain', 'Copy to clipboard')
    })

    it('copies project id config to clipboard', function () {
      cy.get('.action-copy').click()
      .then(() => {
        const expectedJsonConfig = {
          projectId: this.config.projectId,
        }
        const expectedCopyCommand = JSON.stringify(expectedJsonConfig, null, 2)

        expect(this.ipc.setClipboardText).to.be.calledWith(expectedCopyCommand)
      })
    })
  })

  describe('record key panel', () => {
    context('when project is set up and you have access', () => {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.projectStatuses[0].id = this.config.projectId
        this.getProjectStatus.resolve(this.projectStatuses[0])

        this.goToSettings()
        cy.contains('Record Key').click()
      })

      it('displays record key section', () => {
        cy.contains('A Record Key sends')
      })

      it('opens ci guide when learn more is clicked', () => {
        cy.get('.settings-record-key').contains('Learn more').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/what-is-a-record-key')
        })
      })

      it('loads the projects record key', function () {
        expect(this.ipc.getRecordKeys).to.be.called
      })

      it('shows spinner', () => {
        cy.get('.settings-record-key .fa-spinner')
      })

      describe('when record key loads', () => {
        beforeEach(function () {
          this.getRecordKeys.resolve(this.keys)
        })

        it('displays first Record Key', function () {
          cy.get('.loading-record-keys').should('not.exist')
          cy.get('.settings-record-key')
          .contains(`cypress run --record --key ${this.keys[0].id}`)

          cy.percySnapshot()
        })

        it('shows tooltip on hover of copy to clipboard', () => {
          cy.get('.settings-record-key').find('.action-copy').trigger('mouseover')
          cy.get('.cy-tooltip').should('contain', 'Copy to clipboard')
        })

        it('copies record key command to clipboard', function () {
          cy.get('.settings-record-key').find('.action-copy').click()
          .then(() => {
            expect(this.ipc.setClipboardText).to.be.calledWith(`cypress run --record --key ${this.keys[0].id}`)
          })
        })

        it('opens admin project settings when record key link is clicked', () => {
          cy.get('.settings-record-key').contains('You can change').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith(`https://on.cypress.io/dashboard/projects/${this.config.projectId}/settings`)
          })
        })
      })

      describe('when there are no keys', () => {
        beforeEach(function () {
          this.getRecordKeys.resolve([])
        })

        it('displays empty message', () => {
          cy.get('.settings-record-key .empty-well').should('contain', 'This project has no record keys')
          cy.percySnapshot()
        })

        it('opens dashboard project settings when clicking \'Dashboard\'', () => {
          cy.get('.settings-record-key .empty-well a').click().then(function () {
            expect(this.ipc.externalOpen).to.be.calledWith(`https://on.cypress.io/dashboard/projects/${this.config.projectId}/settings`)
          })
        })
      })

      describe('when the user is logged out', () => {
        beforeEach(function () {
          this.getRecordKeys.resolve([])

          cy.logOut()
        })

        it('shows message that user must be logged in to view record keys', () => {
          cy.get('.empty-well').should('contain', 'must be logged in')
          cy.percySnapshot()
        })

        it('opens login modal after clicking \'Log In\'', () => {
          cy.get('.empty-well button').click()
          cy.get('.login')
        })

        it('re-loads and shows the record key when user logs in', function () {
          cy.stub(this.ipc, 'beginAuth').resolves(this.user)

          this.ipc.getRecordKeys.onCall(1).resolves(this.keys)

          cy.get('.empty-well button').click()
          cy.contains('Log In to Dashboard').click().should(() => {
            expect(this.ipc.getRecordKeys).to.be.calledTwice
          })

          cy.get('.settings-record-key')
          .contains(`cypress run --record --key ${this.keys[0].id}`)

          cy.percySnapshot()
        })
      })
    })

    context('when project is not set up for CI', () => {
      it('does not show ci Keys section when project has no id', function () {
        const newConfig = this.util.deepClone(this.config)

        newConfig.projectId = null
        this.openProject.resolve(newConfig)
        this.getProjectStatus.resolve(this.projectStatuses)
        this.goToSettings()

        cy.contains('h5', 'Record Keys').should('not.exist')
        cy.percySnapshot()
      })

      it('does not show ci Keys section when project is invalid', function () {
        this.openProject.resolve(this.config)
        this.projectStatuses[0].state = 'INVALID'
        this.getProjectStatus.resolve(this.projectStatuses[0])
        this.goToSettings()

        cy.contains('h5', 'Record Keys').should('not.exist')
        cy.percySnapshot()
      })
    })

    context('when you are not a user of this projects org', () => {
      beforeEach(function () {
        this.openProject.resolve(this.config)
      })

      it('does not show record key', function () {
        this.projectStatuses[0].state = 'UNAUTHORIZED'
        this.getProjectStatus.resolve(this.projectStatuses[0])
        this.goToSettings()

        cy.contains('h5', 'Record Keys').should('not.exist')
      })
    })
  })

  describe('node version panel', () => {
    const bundledNodeVersion = '1.2.3'
    const systemNodePath = '/foo/bar/node'
    const systemNodeVersion = '4.5.6'

    beforeEach(function () {
      this.navigateWithConfig = function (config) {
        this.openProject.resolve(_.defaults(config, this.config))
        this.projectStatuses[0].id = this.config.projectId
        this.getProjectStatus.resolve(this.projectStatuses[0])
        this.goToSettings()
      }
    })

    it('with bundled node informs user we\'re using bundled node', function () {
      this.navigateWithConfig({})

      cy.contains(`Node.js Version (${bundledNodeVersion})`).click()
      cy.get('.node-version')
      .should('contain', 'bundled with Cypress')
      .should('not.contain', systemNodePath)
      .should('not.contain', systemNodeVersion)

      cy.percySnapshot()
    })

    it('with custom node displays path to custom node', function () {
      this.navigateWithConfig({
        resolvedNodePath: systemNodePath,
        resolvedNodeVersion: systemNodeVersion,
      })

      cy.contains(`Node.js Version (${systemNodeVersion})`).click()
      cy.get('.node-version')
      .should('contain', systemNodePath)
      .should('contain', systemNodeVersion)
      .should('not.contain', bundledNodeVersion)
    })
  })

  describe('proxy settings panel', () => {
    beforeEach(function () {
      this.openProject.resolve(this.config)
      this.config.resolved.baseUrl.value = 'http://localhost:7777'

      this.projectStatuses[0].id = this.config.projectId
      this.getProjectStatus.resolve(this.projectStatuses[0])

      this.goToSettings()
      cy.contains('Proxy Settings').click()
    })

    it('with no proxy config set informs the user no proxy configuration is active', () => {
      cy.get('.settings-proxy').should('contain', 'There is no active proxy configuration.')
    })

    it('opens help link on click', () => {
      cy.get('.settings-proxy .learn-more').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/proxy-configuration')
      })
    })

    it('with Windows proxy settings indicates proxy and the source', () => {
      cy.setAppStore({
        projectRoot: '/foo/bar',
        proxySource: 'win32',
        proxyServer: 'http://foo-bar.baz',
        proxyBypassList: 'a,b,c,d',
      })

      cy.get('.settings-proxy').should('contain', 'from Windows system settings')
      cy.get('.settings-proxy tr:nth-child(1) > td > code').should('contain', 'http://foo-bar.baz')

      cy.get('.settings-proxy tr:nth-child(2) > td > code').should('contain', 'a, b, c, d')
      cy.percySnapshot()
    })

    it('with environment proxy settings indicates proxy and the source', () => {
      cy.setAppStore({
        projectRoot: '/foo/bar',
        proxyServer: 'http://foo-bar.baz',
        proxyBypassList: 'a,b,c,d',
      })
    })

    it('with no bypass list but a proxy set shows \'none\' in bypass list', () => {
      cy.setAppStore({
        projectRoot: '/foo/bar',
        proxyServer: 'http://foo-bar.baz',
      })

      cy.get('.settings-proxy tr:nth-child(2) > td').should('contain', 'none')
    })
  })

  describe('experiments panel', () => {
    const hasNoExperimentsPanel = () => {
      // there are several settings panels,
      // let's make sure they are loaded
      cy.get('[class*=settings-]').should('have.length.gt', 1)
      // but the experiments panel should not be there at all
      cy.get('.settings-experiments').should('not.exist')
    }

    describe('no experimental features turned on', () => {
      beforeEach(function () {
        this.openProject.resolve(this.config)
        this.projectStatuses[0].id = this.config.projectId
        this.getProjectStatus.resolve(this.projectStatuses[0])

        this.goToSettings()
      })

      it('displays panel with no experiments', () => {
        hasNoExperimentsPanel()
        cy.percySnapshot()
      })
    })

    describe('unknown experiments', () => {
      beforeEach(function () {
        this.config.experimentalFoo = true
        this.config.resolved.experimentalFoo = {
          value: true,
        }

        this.openProject.resolve(this.config)
        this.projectStatuses[0].id = this.config.projectId
        this.getProjectStatus.resolve(this.projectStatuses[0])

        this.goToSettings()
      })

      it('are not shown', () => {
        hasNoExperimentsPanel()
      })
    })

    describe('experimental feature exists', () => {
      beforeEach(function () {
        // do not overwrite the shared object reference -
        // because it is used by the app's code.
        this.win.experimental.names.experimentalCoolFeature = 'Cool Feature'
        this.win.experimental.summaries.experimentalCoolFeature = 'Enables super cool feature from Cypress where you can see the cool feature'
      })

      const hasLearnMoreLink = () => {
        cy.get('[data-cy=experiments]').contains('a', 'Learn more').click()
        .then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/experiments')
        })
      }

      context('enabled', () => {
        beforeEach(function () {
          this.config.experimentalCoolFeature = true
          this.config.resolved.experimentalCoolFeature = {
            value: true,
          }

          this.openProject.resolve(this.config)
          this.projectStatuses[0].id = this.config.projectId
          this.getProjectStatus.resolve(this.projectStatuses[0])

          this.goToSettings()
          cy.contains('Experiments').click()
        })

        it('has learn more link', hasLearnMoreLink)

        it('displays experiment', () => {
          cy.get('.settings-experiments').contains('Cool Feature')
          cy.get('.experiment-status-sign')
          .should('have.class', 'enabled')
          .and('have.text', 'enabled')

          cy.percySnapshot()
        })
      })

      context('disabled', () => {
        beforeEach(function () {
          this.config.experimentalCoolFeature = false
          this.config.resolved.experimentalCoolFeature = {
            value: false,
            from: 'default',
          }

          this.openProject.resolve(this.config)
          this.projectStatuses[0].id = this.config.projectId
          this.getProjectStatus.resolve(this.projectStatuses[0])

          this.goToSettings()
          cy.contains('Experiments').click()
        })

        it('displays experiment', () => {
          cy.get('.settings-experiments').contains('Cool Feature')
          cy.get('.experiment-status-sign')
          .should('have.class', 'disabled')
          .and('have.text', 'disabled')

          cy.percySnapshot()
        })
      })
    })
  })

  describe('file preference panel', () => {
    const availableEditors = [
      { id: 'atom', name: 'Atom', isOther: false, openerId: 'atom' },
      { id: 'vim', name: 'Vim', isOther: false, openerId: 'vim' },
      { id: 'sublime', name: 'Sublime Text', isOther: false, openerId: 'sublime' },
      { id: 'vscode', name: 'Visual Studio Code', isOther: false, openerId: 'vscode' },
      { id: 'other', name: 'Other', isOther: true, openerId: '' },
    ]

    beforeEach(function () {
      this.getUserEditor = this.util.deferred()
      cy.stub(this.ipc, 'getUserEditor').returns(this.getUserEditor.promise)
      cy.stub(this.ipc, 'setUserEditor').resolves()

      this.openProject.resolve(this.config)
      this.projectStatuses[0].id = this.config.projectId
      this.getProjectStatus.resolve(this.projectStatuses[0])

      this.goToSettings()

      cy.contains('File Opener Preference').click()
    })

    it('displays file preference section', () => {
      cy.contains('Your preference is used to open files')
    })

    it('opens file preference guide when learn more is clicked', () => {
      cy.get('.file-preference').contains('Learn more').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/file-opener-preference')
      })
    })

    it('loads preferred editor and available editors', function () {
      expect(this.ipc.getUserEditor).to.be.called
    })

    it('shows spinner', () => {
      cy.get('.loading-editors')
    })

    describe('when editors load with preferred editor', () => {
      beforeEach(function () {
        this.getUserEditor.resolve({ availableEditors, preferredOpener: availableEditors[3] })
      })

      it('displays available editors with preferred one selected', () => {
        cy.get('.loading-editors').should('not.exist')
        cy.contains('Atom')
        cy.contains('Other')
        cy.contains('Visual Studio Code').closest('li').should('have.class', 'is-selected')
      })

      it('sets editor through ipc when a different editor is selected', function () {
        cy.contains('Atom').click()
        .closest('li').should('have.class', 'is-selected')

        cy.wrap(this.ipc.setUserEditor).should('be.calledWith', availableEditors[0])
        cy.percySnapshot()
      })
    })

    describe('when editors load without preferred editor', () => {
      beforeEach(function () {
        this.getUserEditor.resolve({ availableEditors })
      })

      it('does not select an editor', () => {
        cy.get('.loading-editors').should('not.exist')
        cy.get('.editor-picker li').should('not.have.class', 'is-selected')
      })
    })
  })

  describe('errors', () => {
    const errorText = 'An unexpected error occurred'

    beforeEach(function () {
      this.err = {
        message: 'Port \'2020\' is already in use.',
        name: 'Error',
        port: 2020,
        portInUse: true,
        stack: '[object Object]↵  at Object.API.get (/Users/jennifer/Dev/Projects/cypress-app/lib/errors.coffee:55:15)↵  at Object.wrapper [as get] (/Users/jennifer/Dev/Projects/cypress-app/node_modules/lodash/lodash.js:4414:19)↵  at Server.portInUseErr (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:58:16)↵  at Server.onError (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:86:19)↵  at Server.g (events.js:273:16)↵  at emitOne (events.js:90:13)↵  at Server.emit (events.js:182:7)↵  at emitErrorNT (net.js:1253:8)↵  at _combinedTickCallback (internal/process/next_tick.js:74:11)↵  at process._tickDomainCallback (internal/process/next_tick.js:122:9)↵From previous event:↵    at fn (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57919:14)↵    at Object.appIpc [as ipc] (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57939:10)↵    at openProject (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:59135:24)↵    at new Project (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:58848:34)↵    at ReactCompositeComponentMixin._constructComponentWithoutOwner (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44052:27)↵    at ReactCompositeComponentMixin._constructComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44034:21)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:43953:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactCompositeComponentMixin.performInitialMount (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44129:34)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44016:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactDOMComponent.ReactMultiChild.Mixin._mountChildAtIndex (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50247:40)↵    at ReactDOMComponent.ReactMultiChild.Mixin._updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50163:43)↵    at ReactDOMComponent.ReactMultiChild.Mixin.updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50123:12)↵    at ReactDOMComponent.Mixin._updateDOMChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45742:12)↵    at ReactDOMComponent.Mixin.updateComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45571:10)↵    at ReactDOMComponent.Mixin.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45527:10)↵    at Object.ReactReconciler.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51396:22)↵    at ReactCompositeComponentMixin._updateRenderedComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44547:23)',
        type: 'PORT_IN_USE_SHORT',
      }

      this.config.resolved.baseUrl.value = 'http://localhost:7777'

      this.projectStatuses[0].id = this.config.projectId
      this.getProjectStatus.resolve(this.projectStatuses[0])
      this.openProject.resolve(this.config)
      this.goToSettings()
      openConfiguration()

      cy.contains('http://localhost:7777').then(() => {
        this.ipc.openProject.onCall(1).rejects(this.err)

        this.ipc.onConfigChanged.yield()
      })
    })

    it('displays errors', () => {
      cy.contains(errorText)
      cy.percySnapshot()
    })

    it('displays config after error is fixed', function () {
      cy.contains(errorText).then(() => {
        this.ipc.openProject.onCall(1).resolves(this.config)

        this.ipc.onConfigChanged.yield()
      })

      cy.contains('Configuration')
    })
  })
})

// --
function setConfigEnv (config, v) {
  return flow([
    merge(config),
    set('resolved.env', v),
  ])({})
}
