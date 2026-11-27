/**
 * Lists the span names in a serialized OTLP trace export request, so callers
 * can log which spans they forward without logging the whole request.
 * @param serviceRequest - the JSON request body a span exporter sends
 * @returns the span names, or an empty list if the body is not an OTLP request
 */
export const getSpanNames = (serviceRequest: string): string[] => {
  let request: unknown

  try {
    request = JSON.parse(serviceRequest)
  } catch {
    return []
  }

  const names: string[] = []

  if (!isObject(request) || !Array.isArray(request.resourceSpans)) {
    return names
  }

  for (const resourceSpan of request.resourceSpans) {
    if (!isObject(resourceSpan) || !Array.isArray(resourceSpan.scopeSpans)) {
      continue
    }

    for (const scopeSpan of resourceSpan.scopeSpans) {
      if (!isObject(scopeSpan) || !Array.isArray(scopeSpan.spans)) {
        continue
      }

      for (const span of scopeSpan.spans) {
        if (isObject(span) && typeof span.name === 'string') {
          names.push(span.name)
        }
      }
    }
  }

  return names
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}
