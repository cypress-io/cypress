require("../spec_helper")

_ = require("lodash")
snapshot = require("snap-shot-it")
stripAnsi = require("strip-ansi")
widestLine = require("widest-line")
env = require("#{root}lib/util/env")
terminal = require("#{root}lib/util/terminal")
terminalSize = require("#{root}lib/util/terminal-size")

sanitizeSnapshot = (str) ->
  snapshot(stripAnsi(str))

render = (tables...) ->
  str = terminal.renderTables(tables...)

  console.log(str)

  str

expectLength = (str, length) ->
  lineLength = widestLine(str.split("\n")[0])

  ## first line should always be 100 chars
  expect(lineLength).to.eq(length)

describe "lib/util/terminal", ->
  context ".convertDecimalsToNumber", ->
    it "divides colWidths by cols", ->
      expect(terminal.convertDecimalsToNumber(
        [25, 25, 5, 15, 15, 15], 200
      )).to.deep.eq([
        50, 50, 10, 30, 30, 30
      ])

    it "adds remainder to first index", ->
      expect(terminal.convertDecimalsToNumber(
        [50, 50], 15
      )).to.deep.eq([
        8, 7
      ])

  context ".getMaximumColumns", ->
    it "uses max 100 when exceeds terminalSize", ->
      sinon.stub(terminalSize, "get").returns({ columns: 1000 })
      expect(terminal.getMaximumColumns()).to.eq(100)

    it "uses terminalSize when less than 100", ->
      sinon.stub(terminalSize, "get").returns({ columns: 99 })
      expect(terminal.getMaximumColumns()).to.eq(99)

    it "overrides terminalSize when in CI", ->
      sinon.stub(env, "get").withArgs("CI").returns("1")
      expect(terminal.getMaximumColumns()).to.eq(100)

  context ".table", ->
    beforeEach ->
      sinon.stub(terminalSize, "get").returns({ columns: 100 })

    it "draws multiple specs summary table", ->
      colAligns = ["left", "right", "right", "right", "right", "right", "right"]
      colWidths = [39, 11, 10, 10, 10, 10, 10]

      table1 = terminal.table({
        colAligns
        colWidths
        type: "noBorder"
        head: ["  Spec", "", "Tests", "Passing", "Failing", "Pending", "Skipped"]
      })

      table2 = terminal.table({
        colAligns
        colWidths
        type: "border"
      })

      table3 = terminal.table({
        colAligns
        colWidths
        type: "noBorder"
        head: ["2 of 3 passed (66%)", "1:05:36", 37, 29, 8, 102, 18]
        style: {
          "padding-right": 2
        }
      })

      table2.push(
        ["foo.js", "00:49", 7, 4, 3, 2, 1]
        ["bar.js", "796ms", 0, 0, 0, 0, 15]
        ["fail/is/whale.js", "03:28", 30, 25, 5, 100, 3]
      )

      str = render(table1, table2, table3)

      expectLength(str, 100)

      sanitizeSnapshot(str)

    it "draws single spec summary table", ->
      table = terminal.table({
        type: "outsideBorder"
      })

      table.push(
        ["Tests:", 1]
        ["Passing:", 2]
        ["Failing:", 3]
        ["Pending:", 4]
        ["Skipped:", 5]
        ["Duration:", 6]
        ["Screenshots:", 7]
        ["Video:", true]
        ["Spec:", "foo/bar/baz.js"]
      )

      str = render(table)

      sanitizeSnapshot(str)

    it "draws a page divider", ->
      table = terminal.table({
        colWidths: [80, 20]
        colAligns: ["left", "right"]
        type: "pageDivider"
        style: {
          "padding-left": 2
          "padding-right": 1
        }
      })

      table.push(["", ""])
      table.push([
        "Running: foo/bar/baz.js...",
        "(100 of 200)"
      ])

      str = render(table)

      expectLength(str, 100)

      sanitizeSnapshot(str)
