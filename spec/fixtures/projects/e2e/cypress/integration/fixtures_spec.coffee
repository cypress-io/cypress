describe "fixtures", ->
  it "looks for csv without extension", ->
    cy.fixture("comma-separated").should "equal", """
      One,Two,Three
      1,2,3

    """

  it "handles files with unknown extensions, reading them as utf-8", ->
    cy.fixture("yaml.yaml").should "equal", """
      - foo
      - bar
      - 

    """
