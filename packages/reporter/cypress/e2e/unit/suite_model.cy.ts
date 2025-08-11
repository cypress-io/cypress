import Suite from '../../../src/runnables/suite-model'
import TestModel from '../../../src/test/test-model'

const suiteWithChildren = (children: Array<Partial<TestModel | Suite>>) => {
  const suite = new Suite({ id: '1', title: '', hooks: [], suites: [], tests: [] }, 0)

  suite.children = children.map((child) => ({ type: 'test', ...child })) as Array<TestModel | Suite>

  return suite
}

describe('Suite model', () => {
  context('state', () => {
    it('is failed when any children have failed', () => {
      const suite = suiteWithChildren([{ state: 'passed' }, { state: 'failed' }])

      expect(suite.state).to.equal('failed')
    })

    it('is pending when all children are pending', () => {
      const suite = suiteWithChildren([{ state: 'pending' }, { state: 'pending' }])

      expect(suite.state).to.equal('pending')
    })

    it('is passed when all children are passed', () => {
      const suite = suiteWithChildren([{ state: 'passed' }, { state: 'passed' }])

      expect(suite.state).to.equal('passed')
    })

    it('is passed when all children are passed or pending', () => {
      const suite = suiteWithChildren([{ state: 'passed' }, { state: 'pending' }])

      expect(suite.state).to.equal('passed')
    })

    it('is passed when there are no children', () => {
      const suite = suiteWithChildren([])

      expect(suite.state).to.equal('passed')
    })

    // TODO: https://github.com/cypress-io/cypress-services/issues/11050
    it.skip('is active when all children are active', () => {
      const suite = suiteWithChildren([{ state: 'active' }, { state: 'active' }])

      expect(suite.state).to.equal('active')
    })

    // TODO: https://github.com/cypress-io/cypress-services/issues/11050
    it.skip('is active when there are active tests with passing tests', () => {
      const suite = suiteWithChildren([{ state: 'active' }, { state: 'passed' }])

      expect(suite.state).to.equal('active')
    })

    // TODO: https://github.com/cypress-io/cypress-services/issues/11050
    it.skip('is active when there are active tests with pending tests', () => {
      const suite = suiteWithChildren([{ state: 'active' }, { state: 'pending' }])

      expect(suite.state).to.equal('active')
    })

    it('is processing when all children are processing', () => {
      const suite = suiteWithChildren([{ state: 'processing' }, { state: 'processing' }])

      expect(suite.state).to.equal('processing')
    })

    it('is processing when there are processing tests with passing tests', () => {
      const suite = suiteWithChildren([{ state: 'processing' }, { state: 'passed' }])

      expect(suite.state).to.equal('processing')
    })

    it('is processing when there are processing tests with pending tests', () => {
      const suite = suiteWithChildren([{ state: 'processing' }, { state: 'pending' }])

      expect(suite.state).to.equal('processing')
    })
  })

  describe('nested suites', () => {
    it('is passed even when children suites are not', () => {
      const suite = suiteWithChildren([{ state: 'passed', type: 'test' }, { state: 'active', type: 'suite' }, { state: 'failed', type: 'suite' }])

      expect(suite.state).to.equal('passed')
      expect(suite.children[0].state).to.equal('passed')
      expect(suite.children[1].state).to.equal('active')
      expect(suite.children[2].state).to.equal('failed')
    })

    it('is failed even when children suites are not', () => {
      const suite = suiteWithChildren([{ state: 'failed' }, { state: 'passed', type: 'suite' }, { state: 'passed', type: 'suite' }])

      expect(suite.state).to.equal('failed')
      expect(suite.children[0].state).to.equal('failed')
      expect(suite.children[1].state).to.equal('passed')
      expect(suite.children[2].state).to.equal('passed')
    })

    // TODO: https://github.com/cypress-io/cypress-services/issues/11050
    it.skip('is active even when children suites are not', () => {
      const suite = suiteWithChildren([{ state: 'active' }, { state: 'processing', type: 'suite' }, { state: 'passed', type: 'suite' }])

      expect(suite.state).to.equal('active')
      expect(suite.children[0].state).to.equal('active')
      expect(suite.children[1].state).to.equal('processing')
      expect(suite.children[2].state).to.equal('passed')
    })

    it('is processing even when children suites are not', () => {
      const suite = suiteWithChildren([{ state: 'processing' }, { state: 'passed', type: 'suite' }, { state: 'pending', type: 'suite' }])

      expect(suite.state).to.equal('processing')
      expect(suite.children[0].state).to.equal('processing')
      expect(suite.children[1].state).to.equal('passed')
      expect(suite.children[2].state).to.equal('pending')
    })

    it('is pending even when children suites are not', () => {
      const suite = suiteWithChildren([{ state: 'pending' }, { state: 'passed', type: 'suite' }, { state: 'failed', type: 'suite' }])

      expect(suite.state).to.equal('pending')
      expect(suite.children[0].state).to.equal('pending')
      expect(suite.children[1].state).to.equal('passed')
      expect(suite.children[2].state).to.equal('failed')
    })
  })
})
