import Suite from './suite-model'
import TestModel from '../test/test-model'

const suiteWithChildren = (children: Array<Partial<TestModel>>) => {
  const suite = new Suite({ id: '1', title: '', hooks: [] }, 0)

  suite.children = children as Array<TestModel>

  return suite
}

describe('Suite model', () => {
  context('status', () => {
    it('is failed when any children have failed', () => {
      const suite = suiteWithChildren([{ status: 'passed' }, { status: 'failed' }])

      expect(suite.status).to.equal('failed')
    })

    it('is pending when all children are pending', () => {
      const suite = suiteWithChildren([{ status: 'pending' }, { status: 'pending' }])

      expect(suite.status).to.equal('pending')
    })

    it('is passed when all children are passed', () => {
      const suite = suiteWithChildren([{ status: 'passed' }, { status: 'passed' }])

      expect(suite.status).to.equal('passed')
    })

    it('is passed when all children are passed or pending', () => {
      const suite = suiteWithChildren([{ status: 'passed' }, { status: 'pending' }])

      expect(suite.status).to.equal('passed')
    })

    it('is passed when there are no children', () => {
      const suite = suiteWithChildren([])

      expect(suite.status).to.equal('passed')
    })

    it('is processing when all children are active', () => {
      const suite = suiteWithChildren([{ status: 'active' }, { status: 'active' }])

      expect(suite.status).to.equal('processing')
    })

    it('is processing when there are active tests with passing tests', () => {
      const suite = suiteWithChildren([{ status: 'active' }, { status: 'passed' }])

      expect(suite.status).to.equal('processing')
    })

    it('is processing when there are active tests with pending tests', () => {
      const suite = suiteWithChildren([{ status: 'active' }, { status: 'pending' }])

      expect(suite.status).to.equal('processing')
    })

    it('is processing when all children are processing', () => {
      const suite = suiteWithChildren([{ status: 'processing' }, { status: 'processing' }])

      expect(suite.status).to.equal('processing')
    })

    it('is processing when there are processing tests with passing tests', () => {
      const suite = suiteWithChildren([{ status: 'processing' }, { status: 'passed' }])

      expect(suite.status).to.equal('processing')
    })

    it('is processing when there are processing tests with pending tests', () => {
      const suite = suiteWithChildren([{ status: 'processing' }, { status: 'pending' }])

      expect(suite.status).to.equal('processing')
    })
  })
})
