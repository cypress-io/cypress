export const isProxyDisabled = (): boolean => {
  return process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1'
}
