const _ = require('lodash')

// extract the 'Difference' section from a snap-shot-it error message
const diffRe = /Difference\n-{10}\n([\s\S]*)\n-{19}\nSaved snapshot text/
const videoRe = /-\s\sVideo\soutput:\s.+mp4/
const expectedAddedVideoSnapshotLines = [
  'Warning: We failed capturing this video.',
  'This error will not affect or change the exit code.',
  'TimeoutError: operation timed out',
  '[stack trace lines]',
]
const expectedDeletedVideoSnapshotLines = [
  '(Video)',
  '-  Started compressing: Compressing to 32 CRF',
]
const sometimesAddedSpacingLine = ''
const sometimesAddedVideoSnapshotLine = '│ Video:        false                                                                            │'
const sometimesDeletedVideoSnapshotLine = '│ Video:        true                                                                             │'

export const isVideoSnapshotError = (err: Error) => {
  const [added, deleted] = [[], []]
  const matches = diffRe.exec(err.message)

  if (!matches || !matches.length) {
    return false
  }

  const lines = matches[1].split('\n')

  for (const line of lines) {
    // past this point, the content is variable - mp4 path length
    if (line.includes('Finished compressing:')) break

    if (line.charAt(0) === '+') added.push(line.slice(1).trim())

    if (line.charAt(0) === '-') deleted.push(line.slice(1).trim())
  }

  _.pull(added, sometimesAddedVideoSnapshotLine, sometimesAddedSpacingLine)
  _.pull(deleted, sometimesDeletedVideoSnapshotLine, sometimesAddedSpacingLine)

  // If a video line exists after removing other static matches, remove it
  const deletedVideoLine = _.remove(deleted, (remainingDeleted) => videoRe.test(remainingDeleted))

  // If we did indeed remove a video line, also remove the (Video) text that preceded it
  if (deletedVideoLine) {
    _.pull(deleted, '(Video)')
  }

  return _.isEqual(added, expectedAddedVideoSnapshotLines) && (deleted.length === 0 || _.isEqual(deleted, expectedDeletedVideoSnapshotLines))
}
