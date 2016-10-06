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
