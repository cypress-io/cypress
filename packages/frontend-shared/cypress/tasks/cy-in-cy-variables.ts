export function setupCyInCyVariables () {
  const configProcessScopedVariables = {}

  return {
    setCyInCyVariables: (keySet: Record<string, any>) => {
      Object.entries(keySet).forEach(([key, value]) => {
        configProcessScopedVariables[key] = value
      })

      return null
    },
    getCyInCyVariables: (keys: string[]) => {
      const variablesToReturn: Record<string, any> = {}

      keys.forEach((key) => {
        variablesToReturn[key] = configProcessScopedVariables[key]
      })

      return variablesToReturn
    },
  }
}
