cy.wrap('foo').should('be.a', 'string')

cy.wrap('foobar').should('have.string', 'bar')

cy.wrap(6).should('be.above', 5)

cy.wrap({ foo: 'bar' }).should('be.an', 'object')

cy.wrap(6).should('be.at.least', 5)

cy.wrap(4).should('be.below', 5)

function argsTest() {
  cy.wrap(arguments).should('be.arguments')
}

cy.wrap(5.1).should('be.approximately', 5, 0.5)

cy.wrap(5.1).should('be.closeTo', 5, 0.5)

cy.wrap([]).should('be.empty')
cy.wrap('').should('be.empty')

cy.wrap([1, 2]).should('be.instanceOf', Array)

cy.wrap(false).should('be.false')

cy.wrap(6).should('be.greaterThan', 5)

cy.wrap(6).should('be.gt', 5)

cy.wrap(6).should('be.gte', 5)

cy.wrap(4).should('be.lessThan', 5)

cy.wrap(4).should('be.lt', 5)

cy.wrap(4).should('be.lte', 5)

cy.wrap(1).should('be.ok')

cy.wrap(true).should('be.true')

cy.wrap(undefined).should('be.undefined')

cy.wrap(6).should('be.within', 5, 10)

namespace ChangeSingleParam {
  let dots = ''
  function addDot() { dots += '.' }
  function getDots() { return dots }
  cy.wrap(addDot).should('change', getDots)
}

() => {
  const myObj = { dots: '' }
  function addDot() { myObj.dots += '.' }
  cy.wrap(addDot).should('change', myObj, 'dots')
}

cy.wrap('tester').should('contain', 'test')

;
() => {
  let val = 1
  function subtractTwo() { val -= 2 }
  function getVal() { return val }
  cy.wrap(subtractTwo).should('decrease', getVal)
}

() => {
  const myObj = { val: 1 }
  function subtractTwo() { myObj.val -= 2 }
  cy.wrap(subtractTwo).should('decrease', myObj, 'val')
}

cy.wrap({ a: 1 }).should('deep.equal', { a: 1 })

cy.wrap(1).should('exist')

cy.wrap(1).should('eq', 1)

cy.wrap({ a: 1 }).should('eql', { a: 1 }).and('not.equal', { a: 1 })

cy.wrap(1).should('equal', 1)

cy.wrap({ a: 1, b: 2 }).should('have.all.keys', 'a', 'b')

cy.wrap({ a: 1, b: 2 }).should('have.any.keys', 'a')

cy.wrap({ a: 1, b: 2 }).should('have.all.key', 'a', 'b')

cy.wrap({ a: 1, b: 2 }).should('have.any.key', 'a')

cy.wrap({ x: {a: 1 }}).should('have.deep.property', 'x', { a: 1 })

cy.wrap([1, 2, 3]).should('have.length', 3)
cy.wrap('foo').should('have.length', 3)

cy.wrap([1, 2, 3]).should('have.length.greaterThan', 2)
cy.wrap('foo').should('have.length.greaterThan', 2)

cy.wrap([1, 2, 3]).should('have.length.gt', 2)
cy.wrap('foo').should('have.length.gt', 2)

cy.wrap([1, 2, 3]).should('have.length.gte', 2)
cy.wrap('foo').should('have.length.gte', 2)

cy.wrap([1, 2, 3]).should('have.length.lessThan', 4)
cy.wrap('foo').should('have.length.lessThan', 4)

cy.wrap([1, 2, 3]).should('have.length.lt', 4)
cy.wrap('foo').should('have.length.lt', 4)

cy.wrap([1, 2, 3]).should('have.length.lte', 4)
cy.wrap('foo').should('have.length.lte', 4)

cy.wrap([1, 2, 3]).should('have.members', [2, 1, 3])

cy.wrap([1, 2, 3]).should('have.ordered.members', [1, 2, 3])

cy.wrap({ a: 1 }).should('have.property', 'a').and('not.have.ownProperty', 'toString')

cy.wrap({ a: 1 }).should('have.property', 'a')
cy.wrap({ a: 1 }).should('have.property', 'a', 1)

cy.wrap('foobar').should('have.string', 'bar')

cy.wrap('foobar').should('include', 'foo')

cy.wrap('foo').should('contain.value', 'foo')
cy.wrap('foo').should('contain.text', 'foo')
cy.wrap('foo').should('contain.html', 'foo')
cy.wrap('foo').should('not.contain.value', 'foo')
cy.wrap('foo').should('not.contain.text', 'foo')
cy.wrap('foo').should('not.contain.html', 'foo')

cy.wrap('foo').should('include.value', 'foo')
cy.wrap('foo').should('include.text', 'foo')
cy.wrap('foo').should('include.html', 'foo')
cy.wrap('foo').should('not.include.value', 'foo')
cy.wrap('foo').should('not.include.text', 'foo')
cy.wrap('foo').should('not.include.html', 'foo')

// Ensure we've extended chai.Includes correctly
expect('foo').to.include.value('foo')
expect('foo').to.contain.text('foo')
expect('foo').to.include.html('foo')
expect('foo').to.not.include.value('foo')
expect('foo').to.not.include.text('foo')
expect('foo').to.not.include.html('foo')

cy.wrap([1, 2, 3]).should('include.members', [1, 2])
;
() => {
  let val = 1
  function addTwo() { val += 2 }
  function getVal() { return val }
  cy.wrap(addTwo).should('increase', getVal)

  const myObj = { val: 1 }
  cy.wrap(addTwo).should('increase', myObj, 'val')
}

cy.wrap('foobar').should('match', /^foo/)

;
() => {
  class Cat {
    meow() {}
  }
  cy.wrap(new Cat()).should('respondTo', 'meow')
}

cy.wrap(1).should('satisfy', (num) => num > 0)

;
() => {
  function badFn() { throw new TypeError('Illegal salmon!') }
  cy.wrap(badFn).should('throw')
  cy.wrap(badFn).should('throw', 'salmon')
  cy.wrap(badFn).should('throw', /salmon/)
}

() => {
  function badFn() { throw new TypeError('Illegal salmon!') }
  cy.wrap(badFn).should('throw', TypeError)
  cy.wrap(badFn).should('throw', TypeError, /salmon/)
}

cy.wrap('foo').should('not.be.a', 'number')

cy.wrap(6).should('not.be.above', 10)

cy.wrap('foo').should('not.be.an', 'object')

cy.wrap(6).should('not.be.at.least', 10)

cy.wrap(4).should('not.be.below', 1)

cy.wrap(1).should('not.be.arguments')

cy.wrap(5.1).should('not.be.approximately', 6, 0.5)

cy.wrap(5.1).should('not.be.closeTo', 6, 0.5)

cy.wrap([1]).should('not.be.empty')
cy.wrap('foo').should('not.be.empty')

cy.wrap([1, 2]).should('not.be.instanceOf', String)

cy.wrap(true).should('not.be.false')

cy.wrap(6).should('be.greaterThan', 7)

cy.wrap(6).should('not.be.gt', 7)

cy.wrap(4).should('not.be.lessThan', 3)

cy.wrap(4).should('not.be.lt', 3)

cy.wrap(4).should('not.be.lte', 3)

cy.wrap(0).should('not.be.ok')

cy.wrap(false).should('not.be.true')

cy.wrap(true).should('not.be.undefined')

cy.wrap(3).should('not.be.within', 5, 10)

cy.wrap(null).should('be.null')
cy.wrap(123).should('not.be.null')

cy.wrap(NaN).should('be.NaN')
cy.wrap('cypress').should('not.be.NaN')

;
() => {
  let dots = ''
  function addDot() { dots += '.' }
  function getDots() { return dots }
  cy.wrap(() => {}).should('not.change', getDots)
}

() => {
  const myObj = { dots: '' }
  function addDot() { myObj.dots += '.' }
  cy.wrap(() => {}).should('not.change', myObj, 'dots')
}

cy.wrap('tester').should('not.contain', 'foo')

;
() => {
  let val = 1
  function subtractTwo() { val -= 2 }
  function getVal() { return val }
  cy.wrap(() => {}).should('not.decrease', getVal)
}

() => {
  const myObj = { val: 1 }
  function subtractTwo() { myObj.val -= 2 }
  cy.wrap(() => {}).should('not.decrease', myObj, 'val')
}

cy.wrap<{a?: number, b?: number }>({ a: 1 }).should('not.deep.equal', { b: 1 })

cy.wrap(null).should('not.exist')

cy.wrap(1).should('not.eq', 2)

cy.wrap({a: 1}).should('eql', {a: 1}).and('not.equal', {a: 1})

cy.wrap(1).should('not.equal', 2)

cy.wrap({ a: 1, b: 2 }).should('not.have.all.keys', 'c', 'd')

cy.wrap({ a: 1, b: 2 }).should('not.have.any.keys', 'c')

cy.wrap({ x: {a: 1 }}).should('not.have.deep.property', 'y', { a: 1 })

cy.wrap([1, 2, 3]).should('not.have.length', 2)
cy.wrap('foo').should('not.have.length', 2)

cy.wrap([1, 2, 3]).should('not.have.length.greaterThan', 4)
cy.wrap('foo').should('not.have.length.greaterThan', 4)

cy.wrap([1, 2, 3]).should('not.have.length.gt', 4)
cy.wrap('foo').should('not.have.length.gt', 4)

cy.wrap([1, 2, 3]).should('have.length.lessThan', 2)
cy.wrap('foo').should('have.length.lessThan', 2)

cy.wrap([1, 2, 3]).should('not.have.length.lt', 2)
cy.wrap('foo').should('not.have.length.lt', 2)

cy.wrap([1, 2, 3]).should('not.have.length.lte', 2)
cy.wrap('foo').should('not.have.length.lte', 2)

cy.wrap([1, 2, 3]).should('not.have.members', [4, 5, 6])

cy.wrap([1, 2, 3]).should('not.have.ordered.members', [4, 5, 6])

;
(Object as any).prototype.b = 2
cy.wrap({ a: 1 }).should('have.property', 'a').and('not.have.ownProperty', 'b')

cy.wrap({ a: 1 }).should('not.have.property', 'b')
cy.wrap({ a: 1 }).should('not.have.property', 'b', 1)

cy.wrap('foobar').should('not.have.string', 'baz')

cy.wrap('foobar').should('not.include', 'baz')

;
() => {
  let val = 1
  function addTwo() { val += 2 }
  function getVal() { return val }
  cy.wrap(() => {}).should('not.increase', getVal)
}

cy.wrap('foobar').should('not.match', /baz$/)

;
() => {
  class Cat {
    meow() {}
  }
  cy.wrap(new Cat()).should('not.respondTo', 'bark')
}

cy.wrap(1).should('not.satisfy', (num) => num < 0)

;
() => {
  function badFn() { console.log('Illegal salmon!') }
  cy.wrap(badFn).should('not.throw')
  cy.wrap(badFn).should('not.throw', 'salmon')
  cy.wrap(badFn).should('not.throw', /salmon/)
}

() => {
  function badFn() { console.log('Illegal salmon!') }
  cy.wrap(badFn).should('not.throw')
  cy.wrap(badFn).should('not.throw', 'salmon')
  cy.wrap(badFn).should('not.throw', /salmon/)
}

// chai-jquery
cy.get('#result').should('be.checked')

cy.get('#result').should('be.disabled')

cy.get('#result').should('be.empty')

cy.get('#result').should('be.enabled')

cy.get('#result').should('be.hidden')

cy.get('#result').should('be.selected')

cy.get('#result').should('be.visible')

cy.get('#result').should('be.focused')
cy.get('#result').should('not.be.focused')

cy.get('#result').should('have.focus')
cy.get('#result').should('not.have.focus')

cy.get('#result').should('contain', 'text')

cy.get('#result').should('have.attr', 'role')
cy.get('#result').should('have.attr', 'role', 'menu')

cy.get('#result').should('have.class', 'success')

cy.get('#result').should('have.css', 'display', 'none')

cy.get('#result').should('have.data', 'foo', 'bar')

cy.get('#result').should('have.descendants', 'h1')

cy.get('#result').should('have.html', '<em>John Doe</em>')

cy.get('#result').should('have.id', 'result')

cy.get('#result').should('have.prop', 'disabled')
cy.get('#result').should('have.prop', 'disabled', false)

cy.get('#result').should('have.text', 'John Doe')

cy.get('textarea').should('have.value', 'foo bar baz')

cy.get('#result').should('match', ':empty')

cy.get('#result').should('not.be.checked')

cy.get('#result').should('not.be.disabled')

cy.get('#result').should('not.be.empty')

cy.get('#result').should('not.be.enabled')

cy.get('#result').should('not.be.hidden')

cy.get('#result').should('not.be.selected')

cy.get('#result').should('not.be.visible')

cy.get('#result').should('not.contain', 'text')

cy.get('#result').should('not.exist')

cy.get('#result').should('not.have.attr', 'role')
cy.get('#result').should('not.have.attr', 'role', 'menu')

cy.get('#result').should('not.have.class', 'success')

cy.get('#result').should('not.have.css', 'display', 'none')

cy.get('#result').should('not.have.data', 'foo', 'bar')

cy.get('#result').should('not.have.descendants', 'h1')

cy.get('#result').should('not.have.html', '<em>John Doe</em>')

cy.get('#result').should('not.have.id', 'result')

cy.get('#result').should('not.have.prop', 'disabled')
cy.get('#result').should('not.have.prop', 'disabled', false)

cy.get('#result').should('not.have.text', 'John Doe')

cy.get('textarea').should('not.have.value', 'foo bar baz')

cy.get('#result').should('not.match', ':empty')

cy
  .get('p')
  .should(($p) => {
    expect($p).to.have.length(3)
    // make sure the first contains some text content
    // should have found 3 elements
    expect($p.first()).to.contain('Hello World')
    // use jquery's map to grab all of their classes
    // jquery's map returns a new jquery object
    const classes = $p.map(function(i, el) {
      return Cypress.$(el).attr('class')
    })
    // call classes.get() to make this a plain array
    expect(classes.get()).to.deep.eq([
      'text-primary',
      'text-danger',
      'text-default'
    ])
  })

cy.get('#result').should('have.text', 'John Doe')

cy.writeFile('../file.path', '', 'utf-8')
cy.writeFile('../file.path', '', {
  flag: 'a+',
  encoding: 'utf-8'
})
cy.writeFile('../file.path', '', 'ascii', {
  flag: 'a+',
  encoding: 'utf-8'
})

cy.get('foo').click()
cy.get('foo').click({
  ctrlKey: true,
})
cy.get('foo').rightclick()
cy.get('foo').dblclick()

// cy.$$() is not jQuery(). It only queries.
// $ExpectError
cy.$$.escapeSelector
cy.$$('.warning')
cy.$$('.warning', cy.$$('.notice'))
