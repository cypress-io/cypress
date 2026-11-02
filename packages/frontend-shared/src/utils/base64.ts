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
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
}

/**
 * Copied from driver/src/cypress/utils.ts
 *
 * Correctly encodes Unicode string to base64
 * @see https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
*/
export function encodeBase64Unicode (str: string) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    // @ts-ignore
    return String.fromCharCode(`0x${p1}`)
  }))
}
