/**
 * Safely serializes an error object to a string, handling circular references
 * and other non-serializable values that would cause JSON.stringify to throw.
 */
export function safeErrorSerialize (error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    try {
      // Try JSON.stringify first, but catch any errors
      return JSON.stringify(error)
    } catch (e) {
      // If JSON.stringify fails (e.g., circular reference), fall back to a safer approach
      try {
        // Try to extract meaningful properties
        const errorObj = error as Record<string, unknown>
        const safeObj: Record<string, unknown> = {}

        // Common error properties
        const commonProps = ['name', 'message', 'code', 'errno', 'stack']

        for (const prop of commonProps) {
          if (prop in errorObj && typeof errorObj[prop] === 'string') {
            safeObj[prop] = errorObj[prop]
          }
        }

        // Try to stringify the safe object
        return JSON.stringify(safeObj)
      } catch (e2) {
        // If even that fails, use a generic fallback
        return `[Non-serializable object: ${error.constructor?.name || 'Object'}]`
      }
    }
  }

  // For primitives and other types, use String() as fallback
  return String(error)
}
