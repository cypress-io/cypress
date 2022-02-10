interface Foo {
  bar: 1
}

const foo: Foo = {
  bar: 1,
}

it('fails', () => {
  expect(cy.wrap(foo.bar)).to.eq(5)
})
