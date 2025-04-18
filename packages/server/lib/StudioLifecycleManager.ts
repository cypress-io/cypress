import { EventEmitter } from 'stream'
import { StudioManager } from './cloud/studio'

export class StudioLifecycleManager extends EventEmitter {
  studioManagerPromise: Promise<StudioManager | null> | null = null
  private static readonly STUDIO_READY_EVENT = 'studio:ready'

  async initialize () {
    this.emit('initialize')
  }

  /**
   * Check if studio manager is ready to be used
   * @returns boolean indicating if studio manager promise exists
   */
  isStudioReady (): boolean {
    return this.studioManagerPromise !== null
  }

  /**
   * Get the studio manager if ready
   * @returns The studio manager promise if ready, or null if not
   */
  getStudioIfReady (): Promise<StudioManager | null> | null {
    return this.studioManagerPromise
  }

  async getStudio () {
    if (!this.studioManagerPromise) {
      throw new Error('Studio manager has not been initialized')
    }

    return this.studioManagerPromise
  }

  async setStudioPromise (studioManagerPromise: Promise<StudioManager | null>) {
    this.studioManagerPromise = studioManagerPromise

    // When the promise resolves, emit the studio:ready event with the studio manager
    studioManagerPromise.then((studioManager) => {
      this.emit(StudioLifecycleManager.STUDIO_READY_EVENT, studioManager)
    })
  }

  /**
   * Register a listener that will be called when the studio is ready
   * @param listener Function to call when studio is ready
   * @returns Function to remove the listener
   */
  onStudioReady (listener: (studioManager: StudioManager) => void): () => void {
    // Use once instead of on to ensure the listener only fires once
    this.once(StudioLifecycleManager.STUDIO_READY_EVENT, listener)

    // If studio is already ready, call the listener immediately and only once
    if (this.studioManagerPromise) {
      this.studioManagerPromise.then((studioManager) => {
        // Remove the listener first to prevent it from being called twice
        this.off(StudioLifecycleManager.STUDIO_READY_EVENT, listener)
        // Only call listener if studioManager is not null
        if (studioManager) {
          listener(studioManager)
        }
      })
    }

    // Return a function to remove the listener
    return () => {
      this.off(StudioLifecycleManager.STUDIO_READY_EVENT, listener)
    }
  }
}
