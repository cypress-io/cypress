const { serializeError } = require('serialize-error')

/**
 * Safely serializes an error object to a string, handling circular references
 * and other non-serializable values that would cause JSON.stringify to throw.
 */
export function safeErrorSerialize (error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  try {
    // Use serialize-error package to handle complex error objects safely
    const serialized = serializeError(error)

    return JSON.stringify(serialized)
  } catch (e) {
    // If even serialize-error fails, use a generic fallback
    return `[Non-serializable object: ${error?.constructor?.name || 'Object'}]`
  }
}
