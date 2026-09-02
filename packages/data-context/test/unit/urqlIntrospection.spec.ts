import { describe, expect, it } from '@jest/globals'
import fs from 'fs-extra'
import path from 'path'
import { buildSchema, introspectionFromSchema } from 'graphql'
import { minifyIntrospectionQuery } from '@urql/introspection'
import { urqlSchema } from '../../src/gen/urql-introspection.gen'

function collectKeys (value: unknown, keys = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectKeys(entry, keys))
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      keys.add(key)
      collectKeys(nested, keys)
    }
  }

  return [...keys].sort()
}

describe('urql-introspection.gen', () => {
  it('is minified before it is written', async () => {
    const sdl = await fs.promises.readFile(path.join(__dirname, '../../schemas/schema.graphql'), 'utf8')
    const minified = minifyIntrospectionQuery(introspectionFromSchema(buildSchema(sdl, { assumeValid: true })))

    // Minification's whole effect is dropping keys, so comparing key sets pins
    // it against whatever the library strips today, and fails as a short list
    // rather than a diff of the whole artifact.
    expect(collectKeys(urqlSchema)).toEqual(collectKeys(minified))
  })
})
