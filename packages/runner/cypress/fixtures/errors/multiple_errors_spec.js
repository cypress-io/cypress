import './setup'

function fail() {
  assert(false,`${this._runnable.hookName || this.test.title} - ${this._runnable.parent.title}`)
}

describe('multiple errors',() => {
  describe('s1',() => {
    afterEach(fail)
    describe('s1.1',() => {
      afterEach(fail)
      it('t1',fail)
    })
  })
})
