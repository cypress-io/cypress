describe('Projects List', function () {
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

    cy.visitIndex().then(function (win) {
      ({ start: this.start, ipc: this.ipc } = win.App)

      cy.stub(this.ipc, 'getOptions').resolves({})
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'logOut').resolves({})
      cy.stub(this.ipc, 'addProject').resolves(this.projects[0])
      cy.stub(this.ipc, 'openProject').resolves(this.config)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'removeProject')

      this.getProjects = this.util.deferred()
      cy.stub(this.ipc, 'getProjects').returns(this.getProjects.promise)

      this.getProjectStatuses = this.util.deferred()

      cy.stub(this.ipc, 'getProjectStatuses').returns(this.getProjectStatuses.promise)
    })
  })

  describe('general behavior', function () {
    beforeEach(function () {
      this.start()
    })

    it('loads projects and shows loader', function () {
      cy.get('.projects-list .loader').then(() => {
        expect(this.ipc.getProjects).to.be.called
      })

      cy.percySnapshot()
    })

    describe('when loaded', function () {
      beforeEach(function () {
        this.getProjects.resolve(this.projects)
      })

      it('displays projects', function () {
        cy.get('.projects-list li').should('have.length', this.projects.length)
        cy.percySnapshot()
      })

      it('displays project name and path', function () {
        cy.get('.projects-list li:first .project-name')
        .should('have.text', 'My-Fake-Project')

        cy.get('.projects-list li:first .project-path')
        .should('have.text', '/Users/Jane/Projects/My-Fake-Project')
      })

      it('goes to project when clicked', function () {
        cy.get('.projects-list a:first').click()

        cy.shouldBeOnProjectSpecs()
      })

      it('gets project statuses', function () {
        cy.get('.projects-list li').then(() => {
          // ensures projects have loaded
          expect(this.ipc.getProjectStatuses).to.be.called
        })
      })

      describe('when project statuses have loaded', function () {
        beforeEach(function () {
          this.getProjectStatuses.resolve(this.projectStatuses)

          // ensures projects have loaded
          cy.get('.projects-list li').should('have.length', 5)
        })

        it('updates local storage with projects', function () {
          const localStorageProjects = this.getLocalStorageProjects()

          expect(localStorageProjects.length).to.equal(5)
        })

        it('updates project names', () => {
          cy.get('.projects-list li .project-name').eq(3).should('have.text', 'Client Work')
        })
      })

      describe('removing project', function () {
        beforeEach(() => {
          cy.get('.projects-list li:first button').click()
        })

        it('removes project from DOM', function () {
          cy.get('.projects-list li').should('have.length', 4)

          cy.contains(this.projects[0].path).should('not.exist')
        })

        it('removes project through ipc', function () {
          expect(this.ipc.removeProject).to.be.calledWith(this.projects[0].path)
        })

        it('removes project from local storage', function () {
          const localStorageProjects = this.getLocalStorageProjects()

          expect(localStorageProjects.length).to.equal(4)
          expect(localStorageProjects[0].path).not.to.equal(this.projects[0].path)
        })
      })
    })

    describe('when projects statuses are cached in local storage', function () {
      beforeEach(function () {
        this.setLocalStorageProjects([
          {
            id: this.projectStatuses[0].id,
            name: 'Cached name',
            path: this.projects[0].path },
        ])

        this.getProjects.resolve(this.projects)
      })

      it('displays cached name', () => {
        cy.get('.project-name:first').should('have.text', 'Cached name')
      })

      it('updates name displayed and in local storage when project statuses load', function () {
        this.getProjectStatuses.resolve(this.projectStatuses)

        cy.get('.project-name:first')
        .should('have.text', this.projectStatuses[0].name)
        .then(() => {
          const localStorageProjects = this.getLocalStorageProjects()

          expect(localStorageProjects[0].name).to.equal(this.projectStatuses[0].name)
        })
      })
    })

    describe('when there are none', function () {
      beforeEach(function () {
        this.getProjects.resolve([])
      })

      it('shows nothing', () => {
        cy.get('.projects-list').should('not.exist')
      })
    })

    describe('order', function () {
      beforeEach(function () {
        this.aCoupleProjects = [
          { id: 'id-a', path: '/project/a' },
          { id: 'id-b', path: '/project/b' },
        ]

        this.ipc.addProject.withArgs('/project/b').resolves({ id: 'id-b', path: '/project/b' })
        this.ipc.addProject.withArgs('/foo/bar').resolves({ id: 'id-bar', path: '/foo/bar' })

        this.assertOrder = (expected) => {
          const actual = this.getLocalStorageProjects().map((project) => {
            return project.id
          })

          expect(actual).to.eql(expected)
        }

        this.getProjects.resolve(this.aCoupleProjects)
      })

      it('puts project at start when dropped', function () {
        cy.get('.project-drop').trigger('drop', this.dropEvent).should(() => {
          this.assertOrder(['id-bar', 'id-a', 'id-b'])
        })
      })

      it('puts project at start when dropped and it already exists', function () {
        this.dropEvent.dataTransfer.files[0].path = '/project/b'

        cy.get('.project-drop').trigger('drop', this.dropEvent).then(() => {
          this.assertOrder(['id-b', 'id-a'])
        })
      })

      it('puts project at start when selected', function () {
        cy.stub(this.ipc, 'showDirectoryDialog').resolves('/foo/bar')

        cy.get('.project-drop a').click().then(() => {
          this.assertOrder(['id-bar', 'id-a', 'id-b'])
        })
      })

      it('puts project at start when selected and it already exists', function () {
        cy.stub(this.ipc, 'showDirectoryDialog').resolves('/project/b')

        cy.get('.project-drop a').click().then(() => {
          this.assertOrder(['id-b', 'id-a'])
        })
      })

      it('puts project at start when clicked on in list', function () {
        cy.get('.projects-list a').eq(1).click().then(() => {
          this.assertOrder(['id-b', 'id-a'])
        })
      })
    })

    describe('errors', function () {
      beforeEach(function () {
        this.getProjects.resolve(this.projects)

        this.error = {
          name: '',
          message: 'Failed to get project statuses',
        }
      })

      it('displays error above list', function () {
        this.getProjectStatuses.reject(this.error)
        cy.get('.alert').should('contain', 'Failed to get project statuses')

        cy.get('.projects-list li').should('have.length', this.projects.length)
        cy.percySnapshot()
      })

      it('does not display api errors', function () {
        this.error.isApiError = true
        this.getProjectStatuses.reject(this.error)

        cy.contains('Failed to get project statuses').should('not.exist')
      })
    })
  })

  describe('if user becomes unauthenticated', function () {
    beforeEach(function () {
      this.unauthError = { name: '', message: '', statusCode: 401 }
      // error is being caught here for some reason, so nullify it
      window.onunhandledrejection = function () {}

      this.start()
    })

    afterEach(() => {
      window.onunhandledrejection = undefined
    })

    it('logs user out when get:projects returns 401', function () {
      this.getProjects.reject(this.unauthError)

      cy.shouldBeLoggedOut()
    })

    it('logs user out when get:project:statuses returns 401', function () {
      this.getProjects.resolve([])
      this.getProjectStatuses.reject(this.unauthError)

      cy.shouldBeLoggedOut()
    })
  })

  describe('when there are projects in local storage that no longer exist', function () {
    beforeEach(function () {
      const localStorageProjects = this.util.deepClone(this.projects)

      localStorageProjects[0].path = 'has/been/moved'
      this.setLocalStorageProjects(localStorageProjects)

      this.projects.shift()
      this.getProjects.resolve(this.projects)

      this.start()
    })

    it('does not display them', () => {
      cy.get('.project-name:first').should('have.text', 'My-Other-Fake-Project')
    })
  })
})
