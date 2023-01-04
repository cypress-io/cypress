function determineTagType (state: string) {
  switch (state) {
    case 'failed':
      return 'failed-status'
    case 'warned':
      return 'warned-status'
    default:
      return 'successful-status'
  }
}

export type SessionStatus = 'creating' | 'created' | 'restoring' |'restored' | 'recreating' | 'recreated' | 'failed'

export {
  determineTagType,
}
