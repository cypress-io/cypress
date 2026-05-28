import http from 'http'

const isOkStatusCodeRe = /^[2|3]\d+$/

export const isOk = (code: number | string): boolean => {
  return !!code && isOkStatusCodeRe.test(code as string)
}

export const getText = (code: number | string): string => {
  return http.STATUS_CODES[code] || 'Unknown Status Code'
}
