import { decodeBase64Unicode } from './base64'

export const isWindows = (window.Cypress?.platform || JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__.base64Config)).platform) === 'win32'
