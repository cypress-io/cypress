it('test', () => {
  const obj = {
    foo () {},
  }
  const stub = cy.stub(obj, 'foo').log(false).as('foo')

  obj.foo('foo', 'bar')
  expect(stub).to.be.called
})
