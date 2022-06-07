import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { MigrationDataSource } from '../../../src/sources'
import { createTestDataContext } from '../helper'

const pkg = require('@packages/root')

describe('MigrationDataSource', () => {
  context('.migration', () => {
    let ctx: DataContext
    let fetchStub: sinon.SinonStub
    let migrationDataSource: MigrationDataSource

    beforeEach(() => {
      ctx = createTestDataContext('open')

      ctx.coreData.currentTestingType = 'e2e'

      fetchStub = sinon.stub()

      sinon.stub(ctx.util, 'fetch').callsFake(fetchStub)
    })

    afterEach(() => {
      fetchStub.reset()
      sinon.restore()
    })

    describe('getVideoEmbedHtml', () => {
      const expectedPayload = {
        videoHtml: '<iframe\n  src=\"https://player.vimeo.com/video/668764401?h=0cbc785eef\"\n  class=\"rounded h-full bg-gray-1000 w-full\"\n  frameborder=\"0\"\n  allow=\"autoplay; fullscreen; picture-in-picture\"\n  allowfullscreen\n/>\n',
      }

      it('loads the video embed html', async () => {
        fetchStub
        .withArgs(`https://on.cypress.io/v10-video-embed/${pkg.version}`)
        .resolves({
          json: sinon.stub().resolves(expectedPayload),
        })

        migrationDataSource = new MigrationDataSource(ctx)

        const videoEmbedHtml = await migrationDataSource.getVideoEmbedHtml()

        expect(videoEmbedHtml).to.eql(expectedPayload.videoHtml)
      })

      it('gracefully returns null when request fails', async () => {
        const jsonStub = sinon.fake(async () => {
          throw new Event('abort')
        })

        fetchStub
        .withArgs(`https://on.cypress.io/v10-video-embed/${pkg.version}`)
        .resolves({
          json: jsonStub,
        })

        migrationDataSource = new MigrationDataSource(ctx)

        const videoEmbedHtml = await migrationDataSource.getVideoEmbedHtml()

        expect(videoEmbedHtml).to.eql(null)
      })
    })
  })
})
