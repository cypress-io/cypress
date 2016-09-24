## this should run
it "t1", ->

## these 3 should be skipped
describe "s1", ->
  beforeEach ->
    cy.visit("/visit_error.html")

  it "t2", ->
  it "t3", ->
  it "t4", ->

## these 3 should also be skipped on uncaught hook error
describe "s2", ->
  it "t5", ->
  it "t6", ->
  it "t7", ->
