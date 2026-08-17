import { createHash } from 'crypto'

export type BodyDigest = { length: number, sha256: string }

// Runs once per response body (twice when lengths match, behind the length
// short-circuit). sha256 sustains ~GB/s, so even rare multi-MB bodies add
// negligible drag next to the base64 decode the CDP transit already costs.
export const digestBody = (body: Buffer): BodyDigest => ({
  length: body.length,
  sha256: createHash('sha256').update(body).digest('hex'),
})

/**
 * Whether a body the intercept pipeline produced is byte-identical to the
 * origin body the digest was taken from. A body we cannot prove identical —
 * including one with no digest to compare against — reads as modified, so
 * callers fall back to replacing the origin response rather than releasing it.
 */
export const isOriginBody = (body: string | Buffer, digest?: BodyDigest): boolean => {
  if (!digest) {
    return false
  }

  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body)

  return buffer.length === digest.length && digestBody(buffer).sha256 === digest.sha256
}
