describe('Global Mode', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('projects').as('projects')
    cy.fixture('projects_statuses').as('projectStatuses')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')

    this.dropEvent = {
      dataTransfer: {
        files: [{ path: '/foo/bar' }],
      },
    }

    this.getLocalStorageProjects = () => {
      return JSON.parse(localStorage.projects || '[]')
    }

    this.setLocalStorageProjects = (projects) => {
      return localStorage.projects = JSON.stringify(projects)
    }

    this.setup = (win) => {
      ({ start: this.start, ipc: this.ipc } = win.App)

      cy.stub(this.ipc, 'getOptions').resolves({})
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'logOut').resolves({})
      cy.stub(this.ipc, 'addProject').resolves(this.projects[0])
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'offOpenProject')
      cy.stub(this.ipc, 'offGetSpecs')
      cy.stub(this.ipc, 'offOnFocusTests')
      cy.stub(this.ipc, 'closeProject')
      cy.stub(this.ipc, 'externalOpen')

      this.getProjects = this.util.deferred()
      cy.stub(this.ipc, 'getProjects').returns(this.getProjects.promise)

      this.getProjectStatuses = this.util.deferred()
      cy.stub(this.ipc, 'getProjectStatuses').returns(this.getProjectStatuses.promise)

      return this.start()
    }

    cy.visitIndex().then(this.setup)
  })

  it('shows cypress logo in nav', () => {
    cy.get('.nav .logo img')
    .should('have.attr', 'src', './img/cypress-inverse.png')
    .then(($el) => {
      return new Cypress.Promise((resolve, reject) => {
        const img = new Image()

        img.onerror = () => reject(new Error `img failed to load src: ${img.src}`)
        img.onload = resolve
        img.src = $el[0].src
      })
    })
  })

  it('shows notice about using Cypress locally', () => {
    cy.contains('versioning Cypress per project')
    cy.percySnapshot()
  })

  it('opens link to docs on click \'installing...\'', () => {
    cy.contains('a', 'installing it via').click().then(function () {
      expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/installing-via-npm')
    })
  })

  it('dismisses notice when close is clicked', function () {
    cy.get('.local-install-notice .close').click()

    cy.get('.local-install-notice').should('not.exist')
  })

  it('stores the dismissal state in local storage', () => {
    cy.get('.local-install-notice .close').click().then(() => {
      expect(localStorage['local-install-notice-dimissed']).to.equal('true')
    })
  })

  it('does not show notice when dismissed state stored in local storage', function () {
    cy.get('.local-install-notice .close').click()
    cy.reload().then(this.setup)
    cy.contains('To get started...')

    cy.get('.local-install-notice').should('not.exist')
  })

  it('shows project drop area with button to select project', function () {
    cy.get('.project-drop p:first').should('contain', 'Drag your project here')

    cy.get('.project-drop a').should('have.text', 'select manually')
  })

  describe('dragging and dropping project', function () {
    it('highlights/unhighlights drop area when dragging over it/leaving it', () => {
      cy.get('.project-drop')
      .trigger('dragover')
      .should('have.class', 'is-dragging-over')
      .trigger('dragleave')
      .should('not.have.class', 'is-dragging-over')
    })

    it('handles drops of non-files gracefully', function (done) {
      cy.window().then((win) => {
        win.onerror = (message) => {
          done(`Should not cause error but threw: ${message}`)
        }
      })

      //# user could drag and drop a link or text, not a file
      this.dropEvent.dataTransfer.files = []
      cy.get('.project-drop').trigger('drop', this.dropEvent)

      cy.wait(300).then(() => {
        done()
      })
    })

    it('unhighlights drop area when dropping a project on it', function () {
      cy.get('.project-drop')
      .trigger('dragover')
      .should('have.class', 'is-dragging-over')
      .trigger('drop', this.dropEvent)
      .should('not.have.class', 'is-dragging-over')
    })

    it('adds project and opens it when dropped', function () {
      cy.get('.project-drop').trigger('drop', this.dropEvent)

      cy.shouldBeOnProjectSpecs()
    })
  })

  describe('selecting project', function () {
    it('adds project and opens it when selected', function () {
      cy.stub(this.ipc, 'showDirectoryDialog').resolves('/foo/bar')

      cy.get('.project-drop a').click().then(() => {
        expect(this.ipc.showDirectoryDialog).to.be.called

        cy.shouldBeOnProjectSpecs()
      })
    })

    it('updates local storage', function () {
      cy.stub(this.ipc, 'showDirectoryDialog').resolves('/foo/bar')

      cy.get('.project-drop a').click().should(() => {
        expect(this.getLocalStorageProjects()[0].id).to.equal(this.projects[0].id)
      })
    })

    it('does nothing when user cancels', function () {
      cy.stub(this.ipc, 'showDirectoryDialog').resolves()
      cy.get('.project-drop a').click()

      cy.shouldBeOnIntro()
    })
  })

  describe('going to project', function () {
    beforeEach(function () {
      cy.get('.project-drop').trigger('drop', this.dropEvent)
    })

    it('displays Back button', () => {
      cy.get('.main-nav .nav:first-child a').invoke('text').should('include', 'Back')
    })

    it('sets title to project name', () => {
      cy.title().should('equal', 'bar')
    })

    describe('going back', function () {
      beforeEach(() => {
        cy.contains('Back').click()
      })

      it('returns to intro on click of back button', () => {
        cy.shouldBeOnIntro()
      })

      it('removes project name from title', () => {
        cy.title().should('equal', 'Cypress')
      })

      it('removes ipc listeners', function () {
        expect(this.ipc.offOpenProject).to.be.called
        expect(this.ipc.offGetSpecs).to.be.called

        expect(this.ipc.offOnFocusTests).to.be.called
      })

      it('closes project', function () {
        expect(this.ipc.closeProject).to.be.called
      })
    })
  })
})
