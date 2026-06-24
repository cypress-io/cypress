import _ from 'lodash'
import mime from 'mime'
import type { BackendStaticResponse } from '../types/internal-types'
import type { GetFixtureFn } from '../types/backend-route'

const htmlLikeRe = /<.+>[\s\S]+<\/.+>/

function isValidJSON (text: unknown) {
  if (_.isObject(text)) {
    return true
  }

  try {
    const o = JSON.parse(text as string)

    return _.isObject(o)
  } catch {
    return false
  }
}

/**
 * Infer Content-Type from fixture body when the file extension is missing or unknown.
 */
export function sniffFixtureContentType (data: unknown): string {
  if (isValidJSON(data)) {
    return mime.getType('json')!
  }

  if (typeof data === 'string' && htmlLikeRe.test(data)) {
    return mime.getType('html')!
  }

  return mime.getType('text')!
}

export function inferFixtureContentType (filePath: string, data: unknown): string {
  return mime.getType(filePath) || sniffFixtureContentType(data)
}

function hasContentTypeHeader (headers: BackendStaticResponse['headers']): boolean {
  if (!headers) {
    return false
  }

  return Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')
}

function normalizeFixtureBody (data: unknown): string | Buffer {
  // NOTE: for backwards compatibility with cy.route
  if (data === null) {
    return JSON.stringify('')
  }

  if (Buffer.isBuffer(data)) {
    return data
  }

  if (typeof data === 'string') {
    return data
  }

  return JSON.stringify(data) ?? ''
}

/**
 * Load a fixture into {@link BackendStaticResponse} and infer Content-Type when unset.
 */
export async function resolveStaticResponseFixture (
  staticResponse: BackendStaticResponse,
  getFixture: GetFixtureFn,
): Promise<void> {
  const { fixture } = staticResponse

  if (!fixture) {
    return
  }

  const data = await getFixture(fixture.filePath, { encoding: fixture.encoding })

  if (!hasContentTypeHeader(staticResponse.headers)) {
    _.set(staticResponse, 'headers.content-type', inferFixtureContentType(fixture.filePath, data))
  }

  staticResponse.body = normalizeFixtureBody(data) as BackendStaticResponse['body']
}
