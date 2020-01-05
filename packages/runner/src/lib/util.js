import path from 'path'

export default {
  /**
 * Correctly decodes Unicode string in encoded in base64
 * @see https://github.com/cypress-io/cypress/issues/5435
 * @see https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
 *
 * @example
  ```
  Buffer.from(JSON.stringify({state: '🙂'})).toString('base64')
  // 'eyJzdGF0ZSI6IvCfmYIifQ=='
  // "window.atob" does NOT work
  // atob('eyJzdGF0ZSI6IvCfmYIifQ==')
  // "{"state":"ð"}"
  // but this function works
  b64DecodeUnicode('eyJzdGF0ZSI6IvCfmYIifQ==')
  '{"state":"🙂"}'
  ```
 */
  b64DecodeUnicode (str) {
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`
    }).join(''))
  },

  hasSpecFile () {
    return !!location.hash
  },

  specFile () {
    return this.specPath().replace(/(.*)\//, '')
  },

  specPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)

      return match && match[1] || ''
    }

    return ''
  },

  // TODO: handle both integration and components specs
  absoluteSpecPath (config) {
    const relativeSpecPath = path.relative('integration', this.specPath())

    return path.join(config.integrationFolder, relativeSpecPath)
  },
}
