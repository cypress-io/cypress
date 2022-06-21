export function hasTypeScriptInstalled (projectRoot: string) {
  try {
    require.resolve('typescript', { paths: [projectRoot] })

    return true
  } catch (e) {
    return false
  }
}
