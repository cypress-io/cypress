/* eslint-disable no-console */

module.exports = async function (params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== 'darwin') {
    console.log('not Mac, skipping after pack hook')

    return
  }

  console.log('****************************')
  console.log('After pack hook')
  console.log(params)
  console.log('****************************')
}
