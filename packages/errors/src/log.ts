export const START_TAG = '<<<CYPRESS.STDERR.START>>>'

export const END_TAG = '<<<CYPRESS.STDERR.END>>>'

export const logError = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.error(START_TAG, ...args, END_TAG)
}
