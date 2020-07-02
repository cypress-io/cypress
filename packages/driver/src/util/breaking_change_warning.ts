import $errUtil from '../cypress/error_utils'

export function wrapBlobUtil (blobUtil) {
  const breakingChanges = [
    'arrayBufferToBlob',
    'base64StringToBlob',
    'binaryStringToBlob',
    'dataURLToBlob',
  ]

  const obj = {}

  Object.keys(blobUtil).forEach((key) => {
    if (breakingChanges.includes(key)) {
      obj[key] = function (...args) {
        const val = blobUtil[key](...args)

        val.then = function () {
          $errUtil.throwErrByPath('breaking_change.blob_util2', {
            args: {
              functionName: key,
            },
          })
        }

        return val
      }
    } else {
      obj[key] = blobUtil[key]
    }
  })

  return obj
}
