/// <reference types="cypress" />
const log = function(){
  const r = cy.state('runnable')
  assert(true, `${r.type} - ${r.parent.title || 'root'}`)
}

describe('nested_hooks', ()=>{
  describe('nested beforeEach', ()=>{
    before(() => {
      log()
      beforeEach(() => {
        log()
      })
    })
    it('test', log)
  })
})
