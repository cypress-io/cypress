import { expect } from 'chai'
import dedent from 'dedent'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { MigrationDataSource } from '../../../src/sources'
import { createTestDataContext } from '../helper'

const pkg = require('@packages/root')

describe('MigrationDataSource', () => {
  context('.migration', () => {
    let ctx: DataContext
    let fetchStub: sinon.SinonStub

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
        videoHtml: dedent`
          <iframe
            src="https://player.vimeo.com/video/668764401?h=0cbc785eef"
            class="rounded h-full bg-gray-1000 w-full"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          />
        `,
      }

      it('loads the video embed html', async () => {
        fetchStub
        .withArgs(`https://on.cypress.io/v10-video-embed/${pkg.version}`)
        .resolves({
          json: sinon.stub().resolves(expectedPayload),
        })

        const migrationDataSource = new MigrationDataSource(ctx)

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

        const migrationDataSource = new MigrationDataSource(ctx)

        const videoEmbedHtml = await migrationDataSource.getVideoEmbedHtml()

        expect(videoEmbedHtml).to.eql(null)
      })
    })
  })
})
