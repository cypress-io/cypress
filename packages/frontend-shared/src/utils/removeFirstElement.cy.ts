import { removeFirstElement } from './removeFirstElement'

// `cyBrowserChromeX16.data` from @cypress-design/icon-registry, the shape
// `verifyBrowserIconSvg` compares against.
const CHROME_ICON = '<g clip-path="url(#cy-svg-5f3b8fcda)"><path d="M0 8a8 8 0 0 0 8 8l3.465-6A3.998 3.998 0 0 1 8 12a3.999 3.999 0 0 1-3.468-2.005L1.07 4A7.97 7.97 0 0 0 0 8Z" fill="#0F9D58"/><path d="M8 16a8 8 0 0 0 6.93-12H8a4 4 0 0 1 3.468 5.995l-.003.005L8 16Z" fill="#FFCD40"/><path fill-rule="evenodd" clip-rule="evenodd" d="M1.07 4A7.997 7.997 0 0 1 8 0a7.997 7.997 0 0 1 6.93 4H8a4 4 0 0 0-3.468 5.995L1.07 4Z" fill="#DB4437"/><circle cx="8" cy="8" r="4" fill="#fff"/><circle cx="8" cy="8" r="3.2" fill="#4285F4"/></g><defs><clipPath id="cy-svg-5f3b8fcda"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs>'

const TITLE = /<title>.*<\/title>/
const DEFS = /<defs>.*<\/defs>/

describe('removeFirstElement', () => {
  const titleCases: Array<[label: string, markup: string]> = [
    ['a rendered icon with its title', `<svg><title>Chrome</title>${CHROME_ICON}</svg>`],
    ['a rendered icon without a title', `<svg>${CHROME_ICON}</svg>`],
    ['two titles, removed through the last', '<svg><title>a</title><path/><title>b</title></svg>'],
    ['an empty title', '<svg><title></title><path/></svg>'],
    ['an unclosed title', '<svg><title>Chrome<path/></svg>'],
    ['a close before the open', '</title><svg><title>Chrome</svg>'],
    ['a title broken across lines', '<svg><title>Chr\nome</title></svg>'],
    ['a title on the second line', '<svg>\r\n<title>Chrome</title><path/></svg>'],
    ['an open on one line and a full title on the next', '<title>a\n<title>b</title>'],
    ['an empty string', ''],
  ]

  titleCases.forEach(([label, markup]) => {
    it(`removes the title like /<title>.*<\\/title>/ for ${label}`, () => {
      expect(removeFirstElement(markup, 'title')).to.equal(markup.replace(TITLE, ''))
    })
  })

  it('removes the defs from the expected icon data', () => {
    const result = removeFirstElement(CHROME_ICON, 'defs')

    expect(result).to.equal(CHROME_ICON.replace(DEFS, ''))
    expect(result).not.to.contain('<defs>')
    expect(result).to.match(/<\/g>$/)
  })

  it('handles 50,000 characters of unclosed titles in linear time', () => {
    const markup = `<svg>${'<title>'.repeat(7_150)}</svg>`
    const start = performance.now()

    expect(removeFirstElement(markup, 'title')).to.equal(markup)
    expect(performance.now() - start).to.be.lessThan(200)
  })
})
