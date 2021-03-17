import { expect } from 'chai'
import { ProjectCt } from '../../src/project-ct'

describe('Project', () => {
  // this test is a simple test for scaffolding,
  // it does not count as a unit test for project-ct
  // FIXME: delete this test once we have real ones
  it('should export a class', () => {
    const p = new ProjectCt('foo')

    expect(typeof p.close).to.equal('function')
  })
})

describe('addComponentTestingUniqueDefaults', () => {
  it('overrides e2e defaults if no user overrides provided', () => {
    const expected = {
      viewportHeight: 500,
      viewportWidth: 500,
    }
    const p = new ProjectCt('foo')

    const actual = p.addComponentTestingUniqueDefaults({
      viewportHeight: 660,
      viewportWidth: 1000,
    })

    expect(actual).to.eql(expected)
  })

  it('uses user configured values if provided', () => {
    const expected = {
      viewportHeight: 444,
      viewportWidth: 444,
    }
    const p = new ProjectCt('foo')

    const actual = p.addComponentTestingUniqueDefaults({
      viewportHeight: 444,
      viewportWidth: 444,
    })

    expect(actual).to.eql(expected)
  })
})
