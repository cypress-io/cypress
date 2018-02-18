import Err from './err-model'

describe('Err model', () => {
  context('.displayMessage', () => {
    it('returns combo of name and message', () => {
      const err = new Err({ name: 'BadError', message: 'Something went wrong' })
      expect(err.displayMessage).to.equal('BadError: Something went wrong')
    })

    it('returns empty string if no name or message', () => {
      const err = new Err()
      expect(err.displayMessage).to.equal('')
    })
  })

  context('.isCommandErr', () => {
    it('returns true if an AssertionError', () => {
      const err = new Err({ name: 'AssertionError', message: 'Something went wrong' })
      expect(err.isCommandErr).to.be.true
    })

    it('returns true if an CypressError', () => {
      const err = new Err({ name: 'CypressError', message: 'Something went wrong' })
      expect(err.isCommandErr).to.be.true
    })

    it('returns false otherwise', () => {
      const err = new Err({ name: 'BadError', message: 'Something went wrong' })
      expect(err.isCommandErr).to.be.false
    })
  })

  context('#update', () => {
    let err
    beforeEach(() => {
      err = new Err({ name: 'BadError', message: 'Something went wrong' })
    })

    it('updates name if specified', () => {
      err.update({ name: 'OtherError' })
      expect(err.name).to.equal('OtherError')
    })

    it('updates message if specified', () => {
      err.update({ message: 'Another thing went wrong' })
      expect(err.message).to.equal('Another thing went wrong')
    })

    it('updates stack if specified', () => {
      err.update({ stack: 'the stack (path/to/file.js 45:203)' })
      expect(err.stack).to.equal('the stack (path/to/file.js 45:203)')
    })

    it('does nothing if props is undefined', () => {
      err.update()
      expect(err.name).to.equal('BadError')
    })

    it('does nothing if props is null', () => {
      err.update(null)
      expect(err.name).to.equal('BadError')
    })
  })
})
