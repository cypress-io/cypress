// One log per console-props rendering branch, every value a literal so a snapshot
// of it tracks the rendering and nothing else. No cy commands: the command log is
// then exactly these rows.
describe('Console Props Shapes', () => {
  it('logs the console-props shapes the CLI renders', () => {
    Cypress.log({
      name: 'props-shapes',
      consoleProps: () => {
        return {
          props: {
            'Text': 'a plain value',
            'Number': 42,
            'Negative': -1.5,
            'Boolean': true,
            'Null': null,
            'Empty String': '',
            'Empty Object': {},
            'Empty Array': [],
            '': 'value under an empty key',
            'A Key Far Longer Than The Column Allows': 'the key is clamped, not this',
            // A tab, a carriage return and an escape sequence, which would
            // re-tabulate the row, overwrite it, and tint it.
            'Control Characters': 'tab\there\rcarriage then \u001b[31mred',
            // Own newlines, plus a line past the terminal width.
            'Multi Line': `first line\r\nsecond line\n${'x'.repeat(200)}`,
            'Scalar List': ['alpha', 'beta', 'gamma'],
            'Rows': [
              { Name: 'first', Count: 1, Detail: { nested: true }, Tags: ['a', 'b'] },
              { Name: 'second', Count: 2, Detail: { nested: false }, Tags: [], Note: 'a note long enough that the table has to clamp it to the cell width' },
              { Name: 'third', Count: 3, Detail: {}, Tags: ['c'] },
            ],
            // A lone row is not a table.
            'One Row': [{ only: 'row' }],
            // Deeper than the default depth, so its last level folds.
            'Nested': { one: { two: { three: { four: 'the deepest value' } } } },
            // More keys than the default row budget allows at any depth.
            'Wide': {
              alpha: 1,
              bravo: 2,
              charlie: 3,
              delta: 4,
              echo: 5,
              foxtrot: 6,
              golf: 7,
              hotel: 8,
              india: 9,
              juliett: 10,
              kilo: 11,
              lima: 12,
            },
          },
        }
      },
    }).end()

    // The envelope keys the driver carries beside `props`. `table` is keyed by
    // render order, every slot naming itself.
    Cypress.log({
      name: 'props-envelope',
      consoleProps: () => {
        return {
          props: { Summary: 'the command’s own key/values' },
          table: {
            1: {
              name: 'Mouse Events',
              data: [
                { 'Event Type': 'pointerdown', 'Target': '<button#toggle>', 'Prevented': false },
                { 'Event Type': 'mousedown', 'Target': '<button#toggle>', 'Prevented': true },
              ],
            },
            2: { name: 'Coords', data: { x: 10, y: 20 } },
          },
          groups: [{ name: 'a logged group', items: 2 }],
          args: ['first argument', 42],
          error: 'AssertionError: the payload did not match\n    at the first frame\n    at the second frame',
        }
      },
    }).end()
  })
})
