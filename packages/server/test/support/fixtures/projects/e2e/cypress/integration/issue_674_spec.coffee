describe "issue 674",  ->
  beforeEach ->
    throw new Error()

  afterEach ->
    throw new Error()

  it "doesn't hang when both beforeEach and afterEach fail",  ->
