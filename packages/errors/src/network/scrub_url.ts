const SENSITIVE_KEYS = Object.freeze(['x-amz-credential', 'x-amz-signature', 'Signature', 'AWSAccessKeyId'])

export const scrubUrl = (url: string): string => {
  const parsedUrl = new URL(url)

  Array.from(parsedUrl.searchParams.entries()).forEach(([key, value]) => {
    if (SENSITIVE_KEYS.includes(key)) {
      parsedUrl.searchParams.set(key, 'X'.repeat(value.length))
    }
  })

  return parsedUrl.href
}
