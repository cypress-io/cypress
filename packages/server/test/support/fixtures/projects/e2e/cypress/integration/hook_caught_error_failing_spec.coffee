testAfterRuns = []

Cypress.on "test:after:run", (test) ->
  testAfterRuns.push(test.title)

## this should run
it "t1a", ->

## these 3 should be skipped
describe "s1a", ->
  beforeEach ->
    cy.get(".does-not-exist", {timeout: 100})

  it "t2a", ->
  it "t3a", ->
  it "t4a", ->

## these 3 should run
describe "s2a", ->
  it "t5a", ->
  it "t6a", ->
  it "t7a", ->

describe "s3a", ->
  before ->
    cy.wrap().then ->
      throw new Error("s3a before hook failed")

  after ->
    ## it should not have fired test:after:run
    ## for t8a yet
    expect(testAfterRuns).to.deep.eq([
      "t1a"
      "t2a"
      "t5a"
      "t6a"
      "t7a"
    ])

  it "t8a", ->
  it "t9a", ->

describe "s4a", ->
  before ->
    throw new Error("s4a before hook failed")

  it "t10a", ->

describe "s5a", ->
  it "fires all test:after:run events", ->
    expect(testAfterRuns).to.deep.eq([
      "t1a"
      "t2a"
      "t5a"
      "t6a"
      "t7a"
      "t8a"
      "t10a"
    ])
