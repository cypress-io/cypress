export interface ForAutBridgeInjection {
  /**
   * Register (or re-register) the AUT bridge for the given primary origin. Idempotent per origin —
   * calling again with the same primary origin is a no-op; calling with a different one re-registers.
   * Throws if the primary origin can't be parsed (rather than silently leaving the AUT unbridged).
   */
  inject (primaryOrigin: string): Promise<void>
}
