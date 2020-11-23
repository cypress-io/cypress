import { deferred } from '../support/util'

describe('Release Notes', () => {
  let ipc
  let releaseNotes
  let getReleaseNotes

  beforeEach(() => {
    let user

    cy.fixture('user').then((theUser) => user = theUser)
    cy.fixture('release_notes').then((theReleaseNotes) => releaseNotes = theReleaseNotes)
    cy.intercept('cypress-banner.jpg', { fixture: 'cypress-banner.jpg' })

    cy.visitIndex().then((win) => {
      ipc = win.App.ipc

      cy.stub(ipc, 'getCurrentUser').resolves(user)
      cy.stub(ipc, 'externalOpen')
      cy.stub(ipc, 'getOptions').resolves({ version: '1.0.0' })
      cy.stub(ipc, 'updaterCheck').resolves('1.2.3')

      getReleaseNotes = deferred()
      cy.stub(ipc, 'getReleaseNotes').returns(getReleaseNotes.promise)

      win.App.start()
    })
  })

  it('opens modal after clicking "Learn more" on update notice', () => {
    cy.get('.update-notice').contains('Learn more').click()
    cy.get('.update-modal').should('be.visible')
  })

  it('shows loading spinner when loading release notes', () => {
    cy.get('.update-notice').contains('Learn more').click()
    cy.get('.update-modal .loader')
  })

  it('shows update instructions if no release notes for version', () => {
    getReleaseNotes.resolve(null)
    cy.get('.update-notice').contains('Learn more').click()
    cy.contains('Update to Version 1.2.3').should('be.visible')
  })

  it('shows update instructions if release notes does not include title or content', () => {
    // if this hasn't been released on on.cypress.io yet, it will use the default redirect
    // and not a 404 error, which returns an empty object
    // also protects against the data not being correct in any case
    getReleaseNotes.resolve({})
    cy.get('.update-notice').contains('Learn more').click()
    cy.contains('Update to Version 1.2.3').should('be.visible')
  })

  it('shows update instructions if getting release notes errors', () => {
    getReleaseNotes.reject(new Error('something went wrong'))
    cy.get('.update-notice').contains('Learn more').click()
    cy.contains('Update to Version 1.2.3').should('be.visible')
  })

  describe('when there are release notes (with all fields included)', () => {
    beforeEach(() => {
      getReleaseNotes.resolve(releaseNotes)
      cy.get('.update-notice').contains('Learn more').click()
    })

    it('shows release notes title', () => {
      cy.contains(releaseNotes.title)
    })

    it('title handles emoji', () => {
      cy.get('.release-notes h4').should('include.text', '😀')
    })

    it('shows banner image', () => {
      cy.get('.release-notes img').should('have.attr', 'src', releaseNotes.bannerImage)
      cy.get('.release-notes img').should('have.attr', 'width', '548')
    })

    it('shows content', () => {
      cy.get('.release-notes .contents')
      .shadow()
      .find('h1')
      .should('have.text', 'This is a great release')
    })

    it('content handles emoji', () => {
      cy.get('.release-notes .contents')
      .shadow()
      .find('h2')
      .should('include.text', '😀 4️⃣ 👽 👍 🌎')
    })

    it('opens links in content externally', () => {
      cy.get('.release-notes .contents')
      .shadow()
      .find('a')
      .each(($a) => {
        cy.wrap($a).click().then(() => {
          expect(ipc.externalOpen).to.be.calledWith($a.attr('href'))
        })
      })
    })

    it('shows update button', () => {
      cy.contains('button', 'Update Now')
    })

    it('shows instructions when clicking update button', () => {
      cy.contains('button', 'Update Now').click()
      cy.contains(releaseNotes.title).should('not.exist')
      cy.contains('Update to Version 1.2.3').should('be.visible')
    })

    it('shows external link', () => {
      cy.get('.release-notes .external-link')
      .scrollIntoView()
      .should('be.visible')
      .find('button')
      .should('have.text', releaseNotes.externalLinkText)
    })

    it('external link text handles emoji', () => {
      cy.get('.release-notes .external-link')
      .should('include.text', '👍')
    })

    it('opens external link externally', () => {
      cy.get('.release-notes .external-link').click().then(() => {
        expect(ipc.externalOpen).to.be.calledWith(releaseNotes.externalLink)
      })
    })
  })

  describe('when there are release notes (with some fields omitted)', () => {
    beforeEach(() => {
      cy.get('.update-notice').contains('Learn more').click()
    })

    it('does not show banner image if there is not one', () => {
      releaseNotes.bannerImage = undefined
      getReleaseNotes.resolve(releaseNotes)

      cy.get('.release-notes img').should('not.exist')
    })

    it('does not show external link if link is not specified', () => {
      releaseNotes.externalLink = undefined
      getReleaseNotes.resolve(releaseNotes)

      cy.get('.release-notes .external-link').should('not.exist')
    })

    it('does not show external link if link text is not specified', () => {
      releaseNotes.externalLinkText = undefined
      getReleaseNotes.resolve(releaseNotes)

      cy.get('.release-notes .external-link').should('not.exist')
    })
  })
})
