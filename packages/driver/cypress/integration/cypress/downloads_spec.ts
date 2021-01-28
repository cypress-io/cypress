import { create } from '../../../src/cypress/downloads'

describe('src/cypress/downloads', () => {
  let log
  let snapshot
  let end
  let downloads
  let downloadItem = {
    id: '1',
    filePath: '/path/to/save/location.csv',
    url: 'http://localhost:1234/location.csv',
    mime: 'text/csv',
  }

  beforeEach(() => {
    end = cy.stub()
    snapshot = cy.stub().returns({ end })
    log = cy.stub().returns({ snapshot })

    downloads = create({ log })
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

      expect(end).to.be.called
    })

    it('is a noop if matching log does not exist', () => {
      downloads.end({ id: '1' })

      expect(end).not.to.be.called
      // also just shouldn't error
    })
  })
})
