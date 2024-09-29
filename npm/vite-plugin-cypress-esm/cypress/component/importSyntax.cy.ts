/// <reference types="cypress" />

/* eslint-disable import/no-duplicates */
import defaultExport1 from './fixtures/kitchenSink'
import * as name1 from './fixtures/kitchenSink'
import { export1 } from './fixtures/kitchenSink'
import { export1 as alias1 } from './fixtures/kitchenSink'
import { default as alias } from './fixtures/kitchenSink'
import defaultExport2, { export2 } from './fixtures/kitchenSink'
import defaultExport3, * as name2 from './fixtures/kitchenSink'
import { export1 as e1, export2 as e2 } from './fixtures/kitchenSink'
import {
  export3,
  export4,
} from './fixtures/kitchenSink'
import {
  export3 as alias3,
  export4 as alias4,
} from './fixtures/kitchenSink'
import defaultExport4, {
  export5,
} from './fixtures/kitchenSink'
import './fixtures/kitchenSink'

// Examples for all syntax
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import

describe('supports every combination of import syntax in a single file', () => {
  it('Import defaultExport1 from "./kitchenSink"', () => {
    expect(defaultExport1).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
      export3: 'export3',
      export4: 'export4',
      export5: 'export5',
      default: {
        export1: 'export1',
        export2: 'export2',
      },
    })
  })

  it('Import * as name1 from "./kitchenSink"', () => {
    expect(name1).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
      export3: 'export3',
      export4: 'export4',
      export5: 'export5',
      default: {
        export1: 'export1',
        export2: 'export2',
      },
    })
  })

  it('Import { export1 } from "./kitchenSink"', () => {
    expect(export1).to.deep.eq('export1')
  })

  it('Import { export1 as alias1 } from "./kitchenSink"', () => {
    expect(alias1).to.deep.eq(export1)
  })

  it('Import { default as alias } from "./kitchenSink"', () => {
    expect(alias).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
    })
  })

  it('Import defaultExport2, { export2, } from "./kitchenSink"', () => {
    expect(defaultExport2).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
      export3: 'export3',
      export4: 'export4',
      export5: 'export5',
      default: {
        export1: 'export1',
        export2: 'export2',
      },
    })

    expect(export2).to.eq('export2')
  })

  it('Import defaultExport3, * as name2 from "./kitchenSink"', () => {
    expect(defaultExport3).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
      export3: 'export3',
      export4: 'export4',
      export5: 'export5',
      default: {
        export1: 'export1',
        export2: 'export2',
      },
    })
  })

  it('Import X, * as Y from "module" syntax is not supported.', () => {
    expect(name2).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
      export3: 'export3',
      export4: 'export4',
      export5: 'export5',
      default: {
        export1: 'export1',
        export2: 'export2',
      },
    })
  })

  it('Import { export1 as e1, export2 as e2 } from "./kitchenSink"', () => {
    expect(e1).to.deep.eq(export1)
    expect(e2).to.deep.eq(export2)
  })

  it(`import {
  export3,
  export4,
} from './fixtures/kitchenSink'`, () => {
    expect(export3).to.deep.eq('export3')
    expect(export4).to.deep.eq('export4')
  })

  it(`import {
  export3 as alias3,
  export4 as alias4,
} from './fixtures/kitchenSink'`, () => {
    expect(alias3).to.deep.eq(export3)
    expect(alias4).to.deep.eq(export4)
  })

  it(`import defaultExport4, {
  export5,
} from './fixtures/kitchenSink'`, () => {
    console.log(defaultExport4)
    expect(defaultExport4).to.deep.eq({
      export1: 'export1',
      export2: 'export2',
      export3: 'export3',
      export4: 'export4',
      export5: 'export5',
      default: {
        export1: 'export1',
        export2: 'export2',
      },
    })

    expect(export5).to.eq('export5')
  })

  it('Import "./kitchenSink"', () => {
    // @ts-expect-error
    expect(window.sideEffect).to.eq('Side Effect')
  })

  describe('import-like syntax', () => {
    it('should ignore if not prefixed with whitespace or newline', () => {
      /*
       * This test will probably explode due to malformed syntax if the exclusion logic isn't working,
       * so the assertion here isn't really necessary but helps mark as a passing test
       */
      const value = ' abc_import abc from "blah"'

      expect(value).not.to.contain('cypress')
    })
  })
})
