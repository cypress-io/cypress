/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { $Location } from '../../../src/cypress/location'

describe('src/cypress/location', () => {
  describe('.normalize', () => {
    it.each([
      ['localhost', 'http://localhost/'],
      ['localhost:8080/app', 'http://localhost:8080/app'],
      // `..` stops isUrlLike from recognizing these, so only the local host check does
      ['0.0.0.0:3000/a/../b', 'http://0.0.0.0:3000/a/../b'],
      ['127.0.0.1/a/../b', 'http://127.0.0.1/a/../b'],
    ])('treats the local host %j as a url', (url, expected) => {
      expect($Location.normalize(url)).toBe(expected)
    })

    it.each([
      'index.html',
      'app/localhost',
      'mylocalhost',
      '10.0.0.1/a/../b',
    ])('leaves %j alone', (url) => {
      expect($Location.normalize(url)).toBe(url)
    })
  })
})
