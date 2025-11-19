import Debug from 'debug'
import type { StudioCDPApi, CDPInternalClient } from '@packages/types/src/studio/studio-server-types'

const debug = Debug('cypress:server:studio:cdp')

const AUT_FRAME_NAME_IDENTIFIER = 'Your project:'

/**
 * This interface exposes CDP APIs to the dynamic studio bundle
 * for rendering snapshots in an iframe within the AUT window.
 */
export class StudioCDP implements StudioCDPApi {
  private cdpClient: CDPInternalClient | null = null

  /**
   * Set the CDP client when it becomes available (e.g., when browser connects)
   */
  setCDPClient (cdpClient: CDPInternalClient | null) {
    this.cdpClient = cdpClient
    debug('CDP client set:', !!cdpClient, cdpClient ? 'client available' : 'client cleared')
  }

  getCDPClient (): CDPInternalClient | null {
    // If CDP client is not set, try to get it from the browser CRI client
    // This is a fallback for cases where setCDPClient wasn't called yet
    if (!this.cdpClient) {
      try {
        // Try to get the CDP client from the browser launcher
        // This works because the browser launcher has a module-level browserCriClient
        // Try Electron first, then Chrome
        const electronLauncher = require('../../browsers/electron')
        let browserCriClient = (electronLauncher as any)._getBrowserCriClient?.()

        if (!browserCriClient?.currentlyAttachedProtocolTarget) {
          const chromeLauncher = require('../../browsers/chrome')

          browserCriClient = (chromeLauncher as any)._getBrowserCriClient?.()
        }

        if (browserCriClient?.currentlyAttachedProtocolTarget) {
          debug('CDP client retrieved from browser CRI client')
          this.cdpClient = browserCriClient.currentlyAttachedProtocolTarget
        }
      } catch (error) {
        debug('Could not retrieve CDP client from browser CRI client:', error)
      }
    }

    return this.cdpClient
  }

  /**
   * Find the snapshot iframe frame ID from the frame tree.
   * The snapshot iframe is created with class 'aut-iframe' and
   * has an ID containing 'AUT Snapshot'.
   */
  async findSnapshotIframeFrameId (): Promise<string | null> {
    if (!this.cdpClient) {
      debug('CDP client not available, cannot find snapshot iframe')

      return null
    }

    try {
      // Enable DOM domain to query iframe attributes
      await this.cdpClient.send('DOM.enable').catch(() => {
        // DOM might already be enabled, ignore error
      })

      const { frameTree } = await this.cdpClient.send('Page.getFrameTree')

      // The snapshot iframe should be a child frame
      // We need to find it by checking the frame's name or by finding
      // the iframe element in the DOM and getting its frame ID
      if (frameTree.childFrames) {
        // First, try to find by checking all child frames
        // We'll need to get the DOM node for each frame to check its attributes
        for (const { frame } of frameTree.childFrames) {
          try {
            // Get the frame owner (iframe element) to check its attributes
            const { backendNodeId } = await this.cdpClient.send(
              'DOM.getFrameOwner',
              {
                frameId: frame.id,
              },
            )

            const { node } = await this.cdpClient.send('DOM.describeNode', {
              backendNodeId,
              depth: 0,
            })

            // Check if this is the snapshot iframe by looking at attributes
            const attributes = node.attributes || []
            const idIndex = attributes.indexOf('id')

            if (idIndex >= 0 && idIndex + 1 < attributes.length) {
              const idValue = attributes[idIndex + 1]

              if (idValue && idValue.includes('AUT Snapshot')) {
                debug('Found snapshot iframe frame ID:', frame.id)

                return frame.id
              }
            }

            // Also check class name
            const classIndex = attributes.indexOf('class')

            if (classIndex >= 0 && classIndex + 1 < attributes.length) {
              const classValue = attributes[classIndex + 1]

              if (
                classValue &&
                classValue.includes('aut-iframe') &&
                frame.name &&
                frame.name.includes('AUT Snapshot')
              ) {
                debug('Found snapshot iframe frame ID by class:', frame.id)

                return frame.id
              }
            }
          } catch (error) {
            // If we can't get frame owner, skip this frame
            debug('Error checking frame:', frame.id, error)
            continue
          }
        }

        // Fallback: if we can't find by attributes, look for a frame
        // that's not the main AUT frame (which starts with AUT_FRAME_NAME_IDENTIFIER)
        // and is not the spec frame
        for (const { frame } of frameTree.childFrames) {
          if (
            frame.name &&
            !frame.name.startsWith(AUT_FRAME_NAME_IDENTIFIER) &&
            !frame.name.includes('spec') &&
            !frame.name.includes('Spec')
          ) {
            // This might be the snapshot iframe
            // Try to verify by checking if it has the aut-iframe class
            try {
              const { backendNodeId } = await this.cdpClient.send(
                'DOM.getFrameOwner',
                {
                  frameId: frame.id,
                },
              )

              const { node } = await this.cdpClient.send('DOM.describeNode', {
                backendNodeId,
                depth: 0,
              })

              const attributes = node.attributes || []
              const classIndex = attributes.indexOf('class')

              if (classIndex >= 0 && classIndex + 1 < attributes.length) {
                const classValue = attributes[classIndex + 1]

                if (classValue && classValue.includes('aut-iframe')) {
                  debug(
                    'Found potential snapshot iframe frame ID (fallback):',
                    frame.id,
                  )

                  return frame.id
                }
              }
            } catch (error) {
              debug('Error in fallback frame check:', error)
            }
          }
        }
      }

      debug('Could not find snapshot iframe in frame tree')

      return null
    } catch (error) {
      debug('Error finding snapshot iframe frame ID:', error)

      return null
    }
  }
}
