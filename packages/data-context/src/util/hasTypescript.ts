export function hasTypeScriptInstalled (projectRoot: string) {
  try {
    // mocking this module is fairly difficult under unit test. We need to mock this for the ProjectConfigIpc unit tests
    // as the scaffolded projects in the data-context package do not install dependencies related to the project.
    if (process.env.CYPRESS_INTERNAL_MOCK_TYPESCRIPT_INSTALL === 'true') {
      return true
    }

    require.resolve('typescript', { paths: [projectRoot] })

    return true
  } catch (e) {
    return false
  }
}
