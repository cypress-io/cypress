import type { Protocol } from 'devtools-protocol'

// Fetch.getResponseBody never resolves for a never-ending body (SSE, MJPEG
// multipart streams) — it waits for the response to finish before returning,
// which wedges the pause and the run along with it (#34470). Streaming the
// body via Network.streamResourceContent instead was rejected: the
// capture-loss PoC measured heavy render-critical body loss under load. See
// cypress-io/engineering-documentation, technical-documentation/technical-decisions/tech-briefs/app/http2/supporting-documents/experimental-fetch/findings.md.
// Deny-listing these provably stream-shaped responses and continuing them
// untouched avoids the eager fetch entirely.
const STREAM_CONTENT_TYPES = new Set(['text/event-stream', 'multipart/x-mixed-replace'])

const getContentType = (responseHeaders?: Protocol.Fetch.HeaderEntry[]): string | undefined => {
  const header = responseHeaders?.find(({ name }) => name.toLowerCase() === 'content-type')

  return header?.value.toLowerCase().split(';')[0].trim()
}

export const shouldSkipResponseBody = (event: Protocol.Fetch.RequestPausedEvent): boolean => {
  // Raw CDP field, not normalizeResourceType's output — that lowercases and
  // allowlists, folding EventSource to 'other'.
  if (event.resourceType === 'EventSource') {
    return true
  }

  const contentType = getContentType(event.responseHeaders)

  return !!contentType && STREAM_CONTENT_TYPES.has(contentType)
}
