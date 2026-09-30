// Node's http module throws when writing a status it can't serialize, so a
// status from user code must pass these checks before it reaches a response.

// Mirrors the reason-phrase characters Node's http module accepts.
const INVALID_STATUS_MESSAGE_CHAR = /[^\t\x20-\x7e\x80-\xff]/

export function isValidStatusCode (statusCode: unknown): statusCode is number {
  return Number.isInteger(statusCode) && (statusCode as number) >= 100 && (statusCode as number) <= 999
}

export function isValidStatusMessage (statusMessage: unknown): statusMessage is string {
  return typeof statusMessage === 'string' && !INVALID_STATUS_MESSAGE_CHAR.test(statusMessage)
}
