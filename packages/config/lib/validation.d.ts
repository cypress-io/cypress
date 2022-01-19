export default {
  isValidClientCertificatesSet(_key: string, certsForUrls: any[]): string | true {},

  isValidBrowser(browser: any): string | true {},

  isValidBrowserList(key: string, browsers: any[]): string | true {},

  isValidRetriesConfig(key: string, value: any): string | true {},

  isPlainObject(key: string, value: any): string | true {},

  isNumber(key: string, value: any): string | true {},

  isNumberOrFalse(key: string, value: any): string | true {},

  isFullyQualifiedUrl(key: string, value: string): string | true {},

  isBoolean(key: string, value: any): string | true {},

  isString(key: string, value: any): string | true {},

  isArray(key: string, value: any): string | true {},

  isStringOrFalse(key: string, value: any): string | true {},

  isStringOrArrayOfStrings(key: string, value: any): string | true {},

  isOneOf(...any: any[]): (key: any, value: any) => boolean {},
}