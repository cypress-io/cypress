exports['lib/util/spec_writer #generateCypressComand can generate a full command 1'] = `
cy.get(".input").type("typed text");
`

exports['lib/util/spec_writer #generateCypressComand can generate a command with no message 1'] = `
cy.get(".btn").click();
`

exports['lib/util/spec_writer #generateCypressComand can generate a command with an array as message 1'] = `
cy.get(".select").select(["one", "two", "three"]);
`

exports['lib/util/spec_writer #generateCypressComand can generate a command with no selector 1'] = `
cy.visit("the://url");
`

exports['lib/util/spec_writer #addCommandsToBody adds commands with comments 1'] = `
/* ==== Generated with Cypress Studio ==== */
cy.get(".input").type("typed text");
cy.get(".btn").click();
/* ==== End Cypress Studio ==== */
`

exports['lib/util/spec_writer #generateTest creates a new test with body 1'] = `
/* === Test Created with Cypress Studio === */
it("my new test", function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.get(".input").type("typed text");
    cy.get(".btn").click();
    /* ==== End Cypress Studio ==== */
});
`

exports['lib/util/spec_writer #appendCommandsToTest can add commands to an existing test defined with it 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #appendCommandsToTest can add commands to an existing test defined with specify 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #createNewTestInSuite can create a new test in a suite defined with describe 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })

    /* === Test Created with Cypress Studio === */
    it('test added to describe', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    });
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #createNewTestInSuite can create a new test in a suite defined with context 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {
    /* === Test Created with Cypress Studio === */
    it('test added to context', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    });
  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #appendCommandsToTest can add commands to an existing test defined with it only 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #createNewTestInSuite can create a new test in a suite defined with describe only 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {
    /* === Test Created with Cypress Studio === */
    it('test added to describe only', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    });
  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #appendCommandsToTest can add commands to an existing test with config 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

`

exports['lib/util/spec_writer #createNewTestInSuite can create a new test in a suite with config 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {
    /* === Test Created with Cypress Studio === */
    it('test added to describe with config', function() {
      /* ==== Generated with Cypress Studio ==== */
      cy.get('.input').type('typed text');
      cy.get('.btn').click();
      /* ==== End Cypress Studio ==== */
    });
  })
})

`

exports['lib/util/spec_writer #createNewTestInFile can create a new test in the root of a file 1'] = `
describe('top level suite', () => {
  describe('inner suite with describe', () => {
    it('test with it', () => {
      cy.get('.btn').click()
    })

    specify('test with specify', () => {
      cy.get('.btn').click()
    })

    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('test with it.only', () => {
      cy.get('.btn').click()
    })

    it('test with config', { responseTimeout: 60000 }, () => {
      cy.get('.btn').click()
    })
  })

  context('inner suite with context', () => {

  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('inner suite with describe.only', () => {

  })

  describe('suite with config', { responseTimeout: 60000 }, () => {

  })
})

/* === Test Created with Cypress Studio === */
it('test added to file', function() {
  /* ==== Generated with Cypress Studio ==== */
  cy.get('.input').type('typed text');
  cy.get('.btn').click();
  /* ==== End Cypress Studio ==== */
});

`

exports['lib/util/spec_writer #createNewTestInFile preserves comments in a completely empty spec 1'] = `
// this is an empty file
// with some comments
/*
that should be accurately
preserved in the output
 */
/* === Test Created with Cypress Studio === */
it('test added to empty file', function() {
 /* ==== Generated with Cypress Studio ==== */
 cy.get('.input').type('typed text');
 cy.get('.btn').click();
 /* ==== End Cypress Studio ==== */
});

`
