const $ = Cypress.$.bind(Cypress)
const $Snapshots = require('../../../../src/cy/snapshots')
const $SnapshotsCss = require('../../../../src/cy/snapshots_css')

const normalizeStyles = (styles) => {
  return styles
  .replace(/\s+/gm, '')
  .replace(/['"]/gm, '\'')
}

const addStyles = (styles, to) => {
  return new Promise((resolve) => {
    $(styles)
    .load(() => {
      return resolve()
    })
    .appendTo(cy.$$(to))
  })
}

describe('driver/src/cy/snapshots_css', () => {
  let setup

  beforeEach(() => {
    setup = () => {
      const snapshots = $Snapshots.create(Cypress, cy.$$, cy.state)
      const snapshotCss = $SnapshotsCss.create(Cypress, cy.$$, cy.state)
      const snapshot = snapshots.createSnapshot()

      return { snapshot, snapshotCss }
    }

    cy.visit('/fixtures/generic.html').then(() => {
      return Cypress.Promise.all([
        addStyles('<link rel="stylesheet" href="/fixtures/generic_styles.css" />', 'head'),
        addStyles('<style>p { color: blue; }</style>', 'head'),
        addStyles('<link media="screen" rel="stylesheet" href="http://localhost:3501/fixtures/generic_styles.css" />', 'head'),
        addStyles('<link media="print" rel="stylesheet" href="/fixtures/generic_styles.css" />', 'head'),
        addStyles('<link media="all" rel="stylesheet" href="/fixtures/generic_styles.css" />', 'body'),
        addStyles('<link rel="stylesheet" href="/fixtures/generic_styles_2.css" />', 'body'),
      ])
    })
  })

  context('.getStyleIds', () => {
    it('returns IDs for cached CSS contents', () => {
      const { snapshot, snapshotCss } = setup()
      const { headStyleIds, bodyStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
      expect(bodyStyleIds).to.eql([{ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' }, { hrefId: 'http://localhost:3500/fixtures/generic_styles_2.css' }])
      // IDs for 2 of the same stylesheets should have referential equality
      expect(headStyleIds[0]).to.equal(bodyStyleIds[0])
    })

    it('returns strings for inline stylesheets', () => {
      const { snapshot, snapshotCss } = setup()
      const { headStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(headStyleIds[1]).to.equal('p { color: blue; }')
    })

    it('returns { href } object for cross-origin stylesheets', () => {
      const { snapshot, snapshotCss } = setup()
      const { headStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(headStyleIds[2]).to.eql({ href: 'http://localhost:3501/fixtures/generic_styles.css' })
    })

    it('works for media-less stylesheets', () => {
      const { snapshot, snapshotCss } = setup()
      const { headStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
    })

    it('works for media=screen stylesheets', () => {
      const { snapshot, snapshotCss } = setup()
      const { headStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(headStyleIds[2]).to.eql({ href: 'http://localhost:3501/fixtures/generic_styles.css' })
    })

    it('works for media=all stylesheets', () => {
      const { snapshot, snapshotCss } = setup()
      const { bodyStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(bodyStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
    })

    it('ignores other media stylesheets', () => {
      const { snapshot, snapshotCss } = setup()
      const { headStyleIds } = snapshotCss.getStyleIds(snapshot)

      expect(headStyleIds).to.have.length(3)
    })
  })

  context('.getStylesByIds', () => {
    let getStyles

    beforeEach(() => {
      getStyles = () => {
        const { snapshot, snapshotCss } = setup()
        const { headStyleIds, bodyStyleIds } = snapshotCss.getStyleIds(snapshot)
        const headStyles = snapshotCss.getStylesByIds(headStyleIds)
        const bodyStyles = snapshotCss.getStylesByIds(bodyStyleIds)

        return { headStyles, bodyStyles }
      }
    })

    it('returns array of css styles for given ids', () => {
      const { headStyles, bodyStyles } = getStyles()

      expect(headStyles[0]).to.equal('.foo { color: green; }')
      expect(headStyles[1]).to.equal('p { color: blue; }')
      expect(bodyStyles[0]).to.eql('.foo { color: green; }')
      expect(bodyStyles[1]).to.eql('.bar { color: red; }')
    })

    it('returns { href } object for cross-origin stylesheets', () => {
      const { headStyles } = getStyles()

      expect(headStyles[2]).to.eql({ href: 'http://localhost:3501/fixtures/generic_styles.css' })
    })

    it('handles rules injected by JavaScript', () => {
      const styleEl = document.createElement('style')

      $(styleEl).appendTo(cy.$$('head'))
      styleEl.sheet.insertRule('.foo { color: red; }', 0)

      const { headStyles } = getStyles()

      expect(headStyles[3]).to.equal('.foo { color: red; }')
    })

    it('replaces CSS paths of style tags with absolute paths', () => {
      const styles = `
      <style>
        @font-face {
          font-family: 'Some Font';
          src: url('../fonts/some-font.eot');
          src: url('../fonts/some-font.eot?#iefix') format('embedded-opentype'), url('../fonts/some-font.woff2') format('woff2'), url('../fonts/some-font.woff') format('woff'), url('../fonts/some-font.ttf') format('truetype'), url('../fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
        }
      </style>
    `

      $(styles).appendTo(cy.$$('head'))

      const { headStyles } = getStyles()

      expect(headStyles[3].replace(/\s+/gm, '')).to.include(`
        @font-face {
          font-family: "Some Font";
          src: url('http://localhost:3500/fonts/some-font.eot?#iefix') format("embedded-opentype"), url('http://localhost:3500/fonts/some-font.woff2') format("woff2"), url('http://localhost:3500/fonts/some-font.woff') format("woff"), url('http://localhost:3500/fonts/some-font.ttf') format("truetype"), url('http://localhost:3500/fonts/some-font.svg#glyphicons_halflingsregular') format("svg");
        }
      `.replace(/\s+/gm, ''))
    })

    it('replaces CSS paths of local stylesheets with absolute paths', () => {
      return addStyles('<link rel="stylesheet" href="nested/with_paths.css" />', 'head').then(() => {
        const { headStyles } = getStyles()

        expect(normalizeStyles(headStyles[3])).to.include(normalizeStyles(`
          @font-face {
            font-family: 'Some Font';
            src: url('http://localhost:3500/fixtures/fonts/some-font.eot?#iefix') format('embedded-opentype'), url('http://localhost:3500/fixtures/fonts/some-font.woff2') format('woff2'), url('http://localhost:3500/fixtures/fonts/some-font.woff') format('woff'), url('http://localhost:3500/fixtures/fonts/some-font.ttf') format('truetype'), url('http://localhost:3500/fixtures/fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        `))
      })
    })
  })
})
