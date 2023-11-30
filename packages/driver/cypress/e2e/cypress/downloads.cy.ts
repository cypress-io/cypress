import $Downloads from '../../../src/cypress/downloads'
import { authCreds } from '../../fixtures/auth_creds'

describe('src/cypress/downloads', () => {
  let log
  let snapshot
  let end
  let error
  let downloads
  let downloadItem = {
    id: '1',
    filePath: '/path/to/save/location.csv',
    url: 'http://localhost:1234/location.csv',
    mime: 'text/csv',
  }
  let action

  beforeEach(() => {
    end = cy.stub()
    error = cy.stub()
    snapshot = cy.stub().returns({ end, error })
    log = cy.stub().returns({ snapshot })
    action = cy.stub()

    downloads = $Downloads.create({ action, log })
  })

  context('#start', () => {
    it('creates snapshot for download', () => {
      downloads.start(downloadItem)
      expect(log).to.be.calledWithMatch({
        message: downloadItem.filePath,
        name: 'download',
        type: 'parent',
        event: true,
        timeout: 0,
      })

      expect(snapshot).to.be.called
    })

    it('consoleProps include download url, save path, and mime type', () => {
      downloads.start(downloadItem)
      const consoleProps = log.lastCall.args[0].consoleProps()

      expect(consoleProps).to.eql({
        'Download URL': downloadItem.url,
        'Saved To': downloadItem.filePath,
        'Mime Type': downloadItem.mime,
      })
    })
  })

  context('#end', () => {
    it('ends snapshot if matching log exists', () => {
      downloads.start(downloadItem)
      downloads.end({ id: '1' })

      expect(action).to.be.calledWith('app:download:received')
      expect(snapshot).to.be.called
      expect(end).to.be.called
    })

    it('fails with snapshot if matching log exists', () => {
      downloads.start(downloadItem)
      downloads.end({ id: '1' }, true)

      expect(action).to.be.calledWith('app:download:received')
      expect(snapshot).to.be.called
      expect(end).not.to.be.called
      expect(error).to.be.called
    })

    it('is a noop if matching log does not exist', () => {
      downloads.end({ id: '1' })

      expect(end).not.to.be.called
      // also just shouldn't error
    })
  })
})

describe('download behavior', () => {
  beforeEach(() => {
    cy.visit('/fixtures/downloads.html')
  })

  it('downloads from anchor tag with download attribute', () => {
    cy.exec(`rm -f ${Cypress.config('downloadsFolder')}/downloads_records.csv`)
    cy.readFile(`${Cypress.config('downloadsFolder')}/downloads_records.csv`).should('not.exist')

    // trigger download
    cy.get('[data-cy=download-csv]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/downloads_records.csv`)
    .should('contain', '"Joe","Smith"')
  })

  // NOTE: webkit opens a new window and doesn't download the file
  it('downloads from anchor tag without download attribute', { browser: '!webkit' }, () => {
    cy.exec(`rm -f ${Cypress.config('downloadsFolder')}/downloads_records.csv`)
    cy.readFile(`${Cypress.config('downloadsFolder')}/downloads_records.csv`).should('not.exist')

    // trigger download
    cy.get('[data-cy=download-without-download-attr]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/downloads_records.csv`)
    .should('contain', '"Joe","Smith"')
  })

  it('invalid download path from anchor tag with download attribute', () => {
    // attempt to download
    cy.get('[data-cy=invalid-download]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/downloads_does_not_exist.csv`).should('not.exist')
  })
})

describe('basic auth download behavior', () => {
  beforeEach(() => {
    cy.visit('/fixtures/downloads.html', {
      auth: authCreds,
    })
  })

  // NOTE: webkit opens a new window and doesn't download the file
  it('downloads basic auth protected file that opens in a new tab', { browser: '!webkit' }, () => {
    cy.exec(`rm -f ${Cypress.config('downloadsFolder')}/download-basic-auth.csv`)
    cy.readFile(`${Cypress.config('downloadsFolder')}/download-basic-auth.csv`).should('not.exist')

    cy.get('[data-cy=download-basic-auth]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/download-basic-auth.csv`)
    .should('contain', '"Joe","Smith"')
  })
})
