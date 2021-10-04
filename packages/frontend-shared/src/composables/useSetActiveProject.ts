import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'

const setActiveProjectMutation = gql`
  mutation setActiveProject($path: String!) {
    setActiveProject(path: $path) {
      activeProject {
        id
        title
        projectId
        projectRoot
        isFirstTimeCT
        isFirstTimeE2E
      }
    }
  }
`

/**
 * @param query Graphql query to select data from the App node in graphql
 * @returns setActiveProject function to execute setActiveProject mutation with provided path
 */
export function useSetActiveProject (query?: string) {
  const activeProjectMutation = useMutation(setActiveProjectMutation)

  const setActiveProject = (path: string) => activeProjectMutation.executeMutation({ path })

  return {
    setActiveProject,
  }
}
