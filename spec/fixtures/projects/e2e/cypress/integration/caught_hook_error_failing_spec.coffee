## this should run
it "t1", ->

## these 3 should be skipped
describe "s1", ->
  beforeEach ->
    cy.get(".does-not-exist", {timeout: 100})

  it "t2", ->
  it "t3", ->
  it "t4", ->

## these 3 should run
describe "s2", ->
  it "t5", ->
  it "t6", ->
  it "t7", ->
