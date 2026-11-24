import { expect } from 'chai'
import { isVideoSnapshotError } from '../lib/videoSnapshotError'

// snap-shot-it mismatch messages, generated with snap-shot-compare from the
// stdout of a two-spec Firefox run whose video capture failed. Each is cut off
// after the "Saved snapshot text" header, the last part isVideoSnapshotError reads.
const oneVideoLine = [
  '',
  '----------',
  'Difference',
  '----------',
  '   ✓ renders the dashboard',
  ' ',
  '   1 passing',
  ' ',
  '-  (Video)',
  '+  Warning: We failed capturing this video.',
  ' ',
  '-  -  Video output: /XXX/XXX/XXX/cypress/videos/dashboard.cy.js.mp4',
  '+  This error will not affect or change the exit code.',
  ' ',
  '+  TimeoutError: operation timed out',
  '+      [stack trace lines]',
  '+',
  '-------------------',
  'Saved snapshot text',
  '-------------------',
].join('\n')

const twoVideoLines = [
  '',
  '----------',
  'Difference',
  '----------',
  '   ✓ renders the dashboard',
  ' ',
  '   1 passing',
  ' ',
  '-  (Video)',
  '+  Warning: We failed capturing this video.',
  ' ',
  '-  -  Video output: /XXX/XXX/XXX/cypress/videos/dashboard.cy.js.mp4',
  '+  This error will not affect or change the exit code.',
  ' ',
  '+  TimeoutError: operation timed out',
  '+      [stack trace lines]',
  '+',
  ' ────────────────────────────────────────────────────────────────────────────────────────────────────',
  '   Running:  settings.cy.js                                                                (2 of 2)',
  ' ',
  ' ',
  '   ✓ renders the dashboard',
  ' ',
  '   1 passing',
  ' ',
  '-  (Video)',
  '-',
  '-  -  Video output: /XXX/XXX/XXX/cypress/videos/settings.cy.js.mp4',
  '-',
  '-------------------',
  'Saved snapshot text',
  '-------------------',
].join('\n')

// Cypress prints each video output line under a "(Video)" header, and the
// deleted header between two deleted video lines hides any matcher state left
// over from the previous line. Without the headers the two lines are adjacent.
const twoAdjacentVideoLines = [
  '',
  '----------',
  'Difference',
  '----------',
  '   ✓ renders the dashboard',
  ' ',
  '   1 passing',
  ' ',
  '-  -  Video output: /XXX/XXX/XXX/cypress/videos/dashboard.cy.js.mp4',
  '+  Warning: We failed capturing this video.',
  ' ',
  '+  This error will not affect or change the exit code.',
  '+',
  '+  TimeoutError: operation timed out',
  '+      [stack trace lines]',
  '+',
  ' ────────────────────────────────────────────────────────────────────────────────────────────────────',
  '   Running:  settings.cy.js                                                                (2 of 2)',
  ' ',
  ' ',
  '   ✓ renders the dashboard',
  ' ',
  '   1 passing',
  ' ',
  '-  -  Video output: /XXX/XXX/XXX/cypress/videos/settings.cy.js.mp4',
  '-',
  '-------------------',
  'Saved snapshot text',
  '-------------------',
].join('\n')

const noVideoLines = [
  '',
  '----------',
  'Difference',
  '----------',
  ' ',
  '   ✓ renders the dashboard',
  ' ',
  '   1 passing',
  '+  1 pending',
  ' ',
  '-------------------',
  'Saved snapshot text',
  '-------------------',
].join('\n')

describe('isVideoSnapshotError', () => {
  it('accepts a diff that swaps one video output line for the capture warning', () => {
    expect(isVideoSnapshotError(new Error(oneVideoLine))).to.be.true
  })

  it('accepts a diff that is missing two video output lines', () => {
    expect(isVideoSnapshotError(new Error(twoVideoLines))).to.be.true
  })

  it('accepts a diff that is missing two adjacent video output lines', () => {
    expect(isVideoSnapshotError(new Error(twoAdjacentVideoLines))).to.be.true
  })

  it('rejects a diff with no video output lines', () => {
    expect(isVideoSnapshotError(new Error(noVideoLines))).to.be.false
  })
})
