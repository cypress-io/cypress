import { expect } from 'chai'
import { ProjectCt } from './project-ct'

describe('Project', () => {
  // this test is a simple test for scaffolding,
  // it does not count as a unit test for project-ct
  // FIXME: delete this test once we have real ones
  it('should export a class', () => {
    const p = new ProjectCt('foo')

    expect(typeof p.close).to.equal('function')
  })
})
