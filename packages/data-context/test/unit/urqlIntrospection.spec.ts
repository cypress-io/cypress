import { describe, expect, it } from '@jest/globals'
import { urqlSchema } from '../../src/gen/urql-introspection.gen'

/**
 * Keys a full introspection carries that `minifyIntrospectionQuery` drops. The
 * GraphCache resolves partial results from type shape and nullability alone, so
 * none of these should reach the generated artifact.
 */
const STRIPPED_BY_MINIFY = [
  'defaultValue',
  'deprecationReason',
  'description',
  'enumValues',
  'inputFields',
  'isDeprecated',
  'isRepeatable',
  'locations',
  'specifiedByUrl',
]

function walk (value: unknown, seen = { keys: new Set<string>(), kinds: new Set<string>() }) {
  if (Array.isArray(value)) {
    value.forEach((entry) => walk(entry, seen))
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      seen.keys.add(key)

      if (key === 'kind' && typeof nested === 'string') {
        seen.kinds.add(nested)
      }

      walk(nested, seen)
    }
  }

  return seen
}

describe('urql-introspection.gen', () => {
  const { keys, kinds } = walk(urqlSchema)

  it('is minified before it is written', () => {
    expect(STRIPPED_BY_MINIFY.filter((key) => keys.has(key))).toEqual([])
  })

  it('keeps the type shape and nullability the GraphCache reads', () => {
    expect(urqlSchema.__schema.types.length).toBeGreaterThan(0)
    expect([...kinds]).toContain('NON_NULL')
  })
})
