/**
 * Correctly decodes Unicode string in encoded in base64
 * Copied from driver/src/cypress/utils.ts
 *
 * @see https://github.com/cypress-io/cypress/issues/5435
 * @see https://github.com/cypress-io/cypress/issues/7507
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

export function decodeBase64Unicode (str: string) {
  return decodeURIComponent(atob(str).split('').map((char) => {
    return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`
  }).join(''))
}
