// TODO: Remove this file when we land type-safe @packages/config
type ErrResult = {
  key: string
  value: any
  type: string
}

export default {
  isValidClientCertificatesSet(_key: string, certsForUrls: any[]): ErrResult | true {},

  isValidBrowser(browser: any): ErrResult | true {},

  isValidBrowserList(key: string, browsers: any[]): ErrResult | true {},

  isValidRetriesConfig(key: string, value: any): ErrResult | true {},

  isPlainObject(key: string, value: any): ErrResult | true {},

  isNumber(key: string, value: any): ErrResult | true {},

  isNumberOrFalse(key: string, value: any): ErrResult | true {},

  isFullyQualifiedUrl(key: string, value: string): ErrResult | true {},

  isBoolean(key: string, value: any): ErrResult | true {},

  isString(key: string, value: any): ErrResult | true {},

  isArray(key: string, value: any): ErrResult | true {},

  isStringOrFalse(key: string, value: any): ErrResult | true {},

  isStringOrArrayOfStrings(key: string, value: any): ErrResult | true {},

  isOneOf(...any: any[]): (key: any, value: any) => boolean {},
}