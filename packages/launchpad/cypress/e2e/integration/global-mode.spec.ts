import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import path from 'path'

describe('Launchpad: Global Mode', () => {
  describe('when no projects have been added', () => {
    it('shows "Add Project" view', () => {
      cy.openGlobalMode()
      cy.visitLaunchpad()
      cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
      cy.get('[data-cy="dropzone"]')
      .should('contain', defaultMessages.globalPage.empty.dropText.split('{0}')[0])
      .find('button')
      .should('contain', 'browse manually')
    })

    it('can add a project by dragging folder into project dropzone', () => {
      cy.openGlobalMode()
      cy.visitLaunchpad()
      cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
      cy.get('[data-cy="dropzone"]')
      .should('contain', defaultMessages.globalPage.empty.dropText.split('{0}')[0])

      cy.scaffoldProject('todos')
      .then((projectPath) => {
        cy.get('[data-cy="dropzone"]')
        .dropFileWithPath(projectPath)
      })

      cy.contains('Welcome to Cypress!')
      cy.get('a').contains('Projects').click()
      cy.get('[data-cy="project-card"]')
      .should('have.length', 1)
      .should('contain', 'todos')
    })
  })

  describe('when projects have been added', () => {
    const setupProjects = (projectList) => {
      cy.openGlobalMode()
      cy.withCtx(async (ctx) => {
        ctx.appData.projects = []

        return Promise.resolve()
      }).then(() => {
        projectList.forEach((projectName) => {
          cy.addProject(projectName)
        })
      })

      cy.visitLaunchpad()

      cy.log('The recents list shows all projects that have been added')
      cy.contains(defaultMessages.globalPage.recentProjectsHeader)

      cy.get('[data-cy="project-card"]')
      .should('have.length', projectList.length)
      .each((card, index) => {
        expect(card).to.contain(projectList[index])
      })
    }

    it('shows the recent projects list sorted by most-recently opened', () => {
      const projectList = ['todos', 'ids', 'cookies', 'plugin-empty']

      setupProjects(projectList)
    })

    it('takes user to the next step when clicking on a project card', () => {
      const projectList = ['todos']

      setupProjects(projectList)
      cy.get('[data-cy="project-card"]').click()
      cy.get('[data-cy="project-card"]')
      .should('have.length', 0)
    })

    it('updates most-recently opened project list when returning from next step', () => {
      const projectList = ['todos', 'ids', 'cookies', 'plugin-empty']

      setupProjects(projectList)

      cy.get('[data-cy="project-card"]').within((cards) => cards.get(2).click())
      cy.get('h1').contains('Welcome to Cypress!')
      cy.get('a').contains('Projects').click()

      cy.get('[data-cy="project-card"]')
      .should('have.length', projectList.length)
      // // TO DO: fix most recently updated list
      // .then((list) => {
      // expect(list.get(0)).to.contain(projectList[2])
      // expect(list.get(0)).to.contain(path.join('cy-projects', path.sep, projectList[2]))
      // })
    })

    it('can open and close the add project dropzone', () => {
      setupProjects(['todos'])
      cy.log('Clicking the "Add Project" button shows the Project Dropzone')
      cy.get('[data-cy="addProjectButton"').click()
      cy.get('[data-cy="dropzone"]').should('exist')

      cy.log('Clicking the x to close the project add area closes the Project Dropzone')
      cy.get('[data-cy="dropzone"]')
      .find('button[aria-label="Close"]')
      .click()

      cy.get('[data-cy="dropzone"]').should('not.exist')

      cy.get('[data-cy="addProjectButton"').click()
      cy.get('[data-cy="dropzone"]').should('exist')

      cy.get('[data-cy="addProjectButton"').click()
      cy.get('[data-cy="dropzone"]').should('not.exist')
    })

    describe('Project card menu', () => {
      it('can be opened', () => {
        setupProjects(['todos'])
        cy.log('Project cards have a menu can be opened')
        cy.get('[data-cy="project-card"] > button').click()

        cy.get('[data-cy="project-card-menu-items"] > button').then((menu) => {
          expect(menu).to.have.lengthOf(3)
          expect(menu.get(0)).to.contain(defaultMessages.globalPage.removeProject)
          expect(menu.get(1)).to.contain(defaultMessages.globalPage.openInIDE)
          expect(menu.get(2)).to.contain(defaultMessages.globalPage.openInFinder)
        })
      })

      it('removes project from list when clicking "Remove Project" menu item', () => {
        const projectList = ['todos', 'cookies']

        setupProjects(projectList)
        cy.get('[data-cy="project-card"] > button').then((menu) => {
          menu.get(0).click()
        })

        cy.get('[data-cy="Remove Project"]').click()

        cy.get('[data-cy="project-card"]')
        .should('have.length', 1)
        .should('contain', projectList[1])
      })

      it('shows file drop zone when no more projects are in list when clicking "Remove Project" menu item', () => {
        setupProjects(['todos'])
        cy.get('[data-cy="project-card"] > button').click()
        cy.get('[data-cy="Remove Project"]').click()

        cy.get('[data-cy="project-card"]').should('not.exist')
        cy.get('[data-cy="dropzone"]')
        .should('contain', defaultMessages.globalPage.empty.dropText.split('{0}')[0])
      })
    })

    describe('Searching the project list', () => {
      const projectList = ['todos', 'ids', 'cookies', 'plugin-empty']

      it('filters project results when searching by project name', () => {
        setupProjects(projectList)
        cy.log('Searching for a project by the project name will filter the project results to only show that project')
        cy.get('#project-search').type('tod')
        cy.get('[data-cy="project-card"]')
        .should('have.length', 1)
        .contains('todos')
        .contains(path.join('cy-projects', 'todos'))

        cy.log('Deleting the search pattern restores the project list')
        cy.get('#project-search').type('{backspace}{backspace}{backspace}')
        cy.get('[data-cy="project-card"]')
        .should('have.length', projectList.length)
      })

      // FIXME: fix Search by project path logic
      it.skip('filters project results when searching by project path', () => {
        setupProjects(projectList)
        cy.get('#project-search').type('packages')
        cy.get('[data-cy="project-card"')
        .should('have.length', projectList.length)

        cy.get('#project-search').type(`${path.sep}todos`)
        cy.contains(defaultMessages.globalPage.noResultsMessage)
      })

      it('shows "empty results" pages when searching for a non-existent name', () => {
        setupProjects(projectList)
        cy.get('#project-search').type('hi')
        cy.get('[data-cy="project-card"]')
        .should('have.length', 0)

        cy.contains(defaultMessages.globalPage.noResultsMessage)

        cy.log('Clicking "clear search" in the empty search results will clear the searchbar and restore the project list')
        cy.get('[data-cy="no-results-clear"]').click()
        cy.get('[data-cy="project-card"]')
        .should('have.length', projectList.length)
      })

      // FIXME: fix Search by project path logic
      it.skip('shows "empty results" pages when searching for a non-existent path', () => {
        setupProjects(projectList)
        cy.get('#project-search').type('packages')
        cy.get('[data-cy="project-card"')
        .should('have.length', projectList.length)

        cy.get('#project-search').type(`${path.sep}random`)
        cy.contains(defaultMessages.globalPage.noResultsMessage)
      })
    })
  })
})
