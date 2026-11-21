import getDisplayName, { splitModuleSuffix } from '../../src/getDisplayName'

const FROM_MODULE = /^(.*) \[from (.*)\]$/

describe('getDisplayName', () => {
  const cases: Array<[label: string, displayName: string, expected: string]> = [
    ['a React DevTools name with its module suffix', 'Image [from Image.react]', 'Image'],
    ['a module suffix with a file extension', 'Button [from Button.react.js]', 'Button'],
    ['a module that matches the component', 'Avatar [from Avatar]', 'Avatar'],
    ['a module for a different component', 'Avatar [from ProfileCard.react]', 'Avatar [from ProfileCard.react]'],
    ['a plain name', 'UserProfile', 'UserProfile'],
    ['a name without the closing bracket', 'Image [from Image.react', 'Image [from Image.react'],
    ['a repeated suffix, split at the last one', 'Image [from Image.react] [from Image.react]', 'Image [from Image.react] [from Image.react]'],
    ['an empty module', 'Image [from ]', 'Image [from ]'],
    ['an empty component', ' [from Image.react]', ' [from Image.react]'],
    ['a name containing a newline', 'Image [from\nImage.react]', 'Image [from\nImage.react]'],
    ['a name containing a carriage return', 'Image\r [from Image.react]', 'Image\r [from Image.react]'],
  ]

  cases.forEach(([label, displayName, expected]) => {
    it(`handles ${label}`, () => {
      expect(getDisplayName({ type: { displayName } } as any)).to.equal(expected)

      const match = displayName.match(FROM_MODULE)

      expect(splitModuleSuffix(displayName)).to.deep.equal(match ? { componentName: match[1], moduleName: match[2] } : null)
    })
  })

  it('falls back to the type name, then the fallback name', () => {
    expect(getDisplayName({ type: { name: 'Counter' } } as any)).to.equal('Counter')
    expect(getDisplayName({ type: {} } as any, 'Fallback')).to.equal('Fallback')
    expect(getDisplayName(null)).to.equal('Unknown')
  })

  it('handles a 50,000-character name of repeated suffixes in linear time', () => {
    const displayName = `${' [from '.repeat(7_142)}m`
    const start = performance.now()

    expect(getDisplayName({ type: { displayName } } as any)).to.equal(displayName)
    expect(performance.now() - start).to.be.lessThan(200)
  })
})
