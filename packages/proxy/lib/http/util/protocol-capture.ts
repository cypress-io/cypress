const requestIdRegEx = /^(.*)-retry-([\d]+)$/

/**
 * Strip synthetic retry suffixes from CDP request IDs before protocol capture.
 */
export function getOriginalRequestId (requestId: string) {
  let originalRequestId = requestId
  const match = requestIdRegEx.exec(requestId)

  if (match) {
    [, originalRequestId] = match
  }

  return originalRequestId
}
