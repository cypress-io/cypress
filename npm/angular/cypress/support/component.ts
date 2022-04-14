import '@cypress/angular/support'
import 'core-js/es/reflect'
import 'core-js/stable/reflect'
import 'core-js/features/reflect'
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'
import '@cypress/code-coverage/support'

addMatchImageSnapshotCommand({
  failureThreshold: 0.5, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: 'viewport', // capture viewport in screenshot
})
