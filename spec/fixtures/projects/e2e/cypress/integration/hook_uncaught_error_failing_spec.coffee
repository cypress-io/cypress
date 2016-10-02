## this should run
it "t1b", ->

## these 3 should be skipped
describe "s1b", ->
  beforeEach ->
    cy.visit("/visit_error.html")

  it "t2b", ->
  it "t3b", ->
  it "t4b", ->

## these 3 should run because we override mocha's
## default handling of uncaught errors
describe "s2b", ->
  it "t5b", ->
  it "t6b", ->
  it "t7b", ->
