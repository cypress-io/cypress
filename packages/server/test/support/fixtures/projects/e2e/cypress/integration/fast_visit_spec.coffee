beforeEach ->
  cy.on "log:added", (attrs, log) =>
    if attrs.name is "visit"
      @lastLog = log

  return null

fastVisitSpec = (url) ->
  cy.visit(url)

  times = []

  Cypress._.times 100, ->
    cy.visit(url)
    .then ->
      time = @lastLog.get("totalTime")
      times.push(time)

  cy.then ->
    times.sort (a, b) ->
      a - b

    percentile = (p) ->
      i = Math.floor(p / 100 * times.length) - 1
      times[i]

    percentiles = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 97, 99, 100].map (p) ->
      [p, percentile(p)]

    cy
    .task('record:fast_visit_spec', {
      percentiles,
      url,
      browser: Cypress.config('browser').name
      currentRetry: Cypress.env('currentRetry')
    })
    .then ->
      expect(percentile(80)).to.be.lte(100)

      expect(percentile(95)).to.be.lte(250)

context "on localhost 95% of visits are faster than 250ms, 80% are faster than 100ms", ->
  it "with connection: close", ->
    fastVisitSpec '/close'

  it "with connection: keep-alive", ->
    fastVisitSpec '/keepalive'
