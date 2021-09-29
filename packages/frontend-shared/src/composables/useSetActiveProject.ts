import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'

function makeSetActiveProjectQuery (query?: string) {
  const activeProjectQuery = `
    activeProject {
      id
      title
      projectId
      projectRoot
      isFirstTimeCT
      isFirstTimeE2E
    }
  `

  return gql`
    mutation setActiveProject($path: String!) {
      setActiveProject(path: $path) {
        ${query ? query : activeProjectQuery}
      }
    }
  `
}

/**
 * @param query Graphql query to select data from the App node in graphql
 * @returns setActiveProject function to execute setActiveProject mutation with provided path
 */
export function useSetActiveProject (query?: string) {
  const activeProjectMutation = useMutation(makeSetActiveProjectQuery(query))

  const setActiveProject = (path: string) => activeProjectMutation.executeMutation({ path })

  return {
    setActiveProject,
  }
}
