require('../../spec_helper')

const snapshot = require('snap-shot-it')
const stripAnsi = require('strip-ansi')
const widestLine = require('widest-line')
const env = require(`../../../lib/util/env`)
const terminal = require(`../../../lib/util/terminal`)
const terminalSize = require(`../../../lib/util/terminal-size`)

const sanitizeSnapshot = (str) => {
  return snapshot(stripAnsi(str))
}

const render = function (...tables) {
  const str = terminal.renderTables(...tables)

  // eslint-disable-next-line no-console
  console.log(str)

  return str
}

const expectLength = function (str, length) {
  const lineLength = widestLine(str.split('\n')[0])

  // first line should always be 100 chars
  expect(lineLength).to.eq(length)
}

describe('lib/util/terminal', () => {
  context('.getMaximumColumns', () => {
    it('uses max 100 when exceeds terminalSize', () => {
      sinon.stub(terminalSize, 'get').returns({ columns: 1000 })

      expect(terminal.getMaximumColumns()).to.eq(100)
    })

    it('uses terminalSize when less than 100', () => {
      sinon.stub(terminalSize, 'get').returns({ columns: 99 })

      expect(terminal.getMaximumColumns()).to.eq(99)
    })

    it('overrides terminalSize when in CI', () => {
      sinon.stub(env, 'get').withArgs('CI').returns('1')

      expect(terminal.getMaximumColumns()).to.eq(100)
    })
  })

  context('.table', () => {
    beforeEach(() => {
      return sinon.stub(terminalSize, 'get').returns({ columns: 100 })
    })

    it('draws multiple specs summary table', () => {
      const colAligns = ['left', 'right', 'right', 'right', 'right', 'right', 'right']
      const colWidths = [39, 11, 10, 10, 10, 10, 10]

      const table1 = terminal.table({
        colAligns,
        colWidths,
        type: 'noBorder',
        head: ['Spec', '', 'Tests', 'Passing', 'Failing', 'Pending', 'Skipped'],
      })

      const table2 = terminal.table({
        colAligns,
        colWidths,
        type: 'border',
      })

      const table3 = terminal.table({
        colAligns,
        colWidths,
        type: 'noBorder',
        head: ['2 of 3 passed (66%)', '1:05:36', 37, 29, 8, 102, 18],
      })

      table2.push(
        ['foo.js', '00:49', 7, 4, 3, 2, 1],
        ['bar.js', '796ms', 0, 0, 0, 0, 15],
        ['fail/is/whale.js', '03:28', 30, 25, 5, 100, 3],
      )

      const str = render(table1, table2, table3)

      expectLength(str, 100)

      return sanitizeSnapshot(str)
    })

    it('draws single spec summary table', () => {
      const table = terminal.table({
        type: 'outsideBorder',
      })

      table.push(
        ['Tests:', 1],
        ['Passing:', 2],
        ['Failing:', 3],
        ['Pending:', 4],
        ['Skipped:', 5],
        ['Duration:', 6],
        ['Screenshots:', 7],
        ['Video:', true],
        ['Spec:', 'foo/bar/baz.js'],
      )

      const str = render(table)

      return sanitizeSnapshot(str)
    })

    it('draws a page divider', () => {
      const table = terminal.table({
        colWidths: [80, 20],
        colAligns: ['left', 'right'],
        type: 'pageDivider',
        style: {
          'padding-left': 2,
          'padding-right': 1,
        },
      })

      table.push(['', ''])
      table.push([
        'Running: foo/bar/baz.js...',
        '(100 of 200)',
      ])

      const str = render(table)

      expectLength(str, 100)

      return sanitizeSnapshot(str)
    })
  })
})
