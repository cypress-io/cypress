import { expect } from 'chai'
import sinon from 'sinon'

import { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { RelevantRunsDataSource, EMPTY_RETURN } from '../../../src/sources'

const TEST_SHA = 'fcb90fc753a2111d1eb32d207e801e6b2985a231'

describe('RelevantRunsDataSource', () => {
  let ctx: DataContext
  let dataSource: RelevantRunsDataSource

  beforeEach(() => {
    ctx = createTestDataContext('open')
    dataSource = new RelevantRunsDataSource(ctx)
    //sinon.stub(ctx.util, 'fetch').resolves({} as any)
    // sinon.stub(ctx.util, 'fetch').callsFake(() => {
    //   console.log(args)
    // })
  })

  it('returns empty with no shas', async () => {
    const result = await dataSource.getRelevantRuns([])

    expect(result).to.equal(EMPTY_RETURN)
  })

  it('returns empty with no project set', async () => {
    sinon.stub(ctx.project, 'projectId').resolves(undefined)

    const result = await dataSource.getRelevantRuns([TEST_SHA])

    expect(result).to.equal(EMPTY_RETURN)
  })

  //TODO: Skipping to figure out how to mock cloud query
  it.skip('returns empty if cloud project not loaded', async () => {
    sinon.stub(ctx.project, 'projectId').resolves('test123')

    // ;(ctx.util.fetch as SinonStub).resolves({} as any)

    const result = await dataSource.getRelevantRuns([TEST_SHA])

    //expect(ctx.util.fetch).to.have.been.calledOnce

    expect(result).to.equal(EMPTY_RETURN)
  })

  it('returns latest RUNNING build as current if only RUNNING found')

  it('returns latest completed build')

  it('returns latest completed and running if both found')

  it('returns the same current if current already set')

  it('returns a new current if moveToNext is called')
})
