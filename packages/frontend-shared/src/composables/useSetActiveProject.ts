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

export function useSetActiveProject () {
  const activeProjectMutation = useMutation(setActiveProjectMutation)

  const setActiveProject = (path: string) => activeProjectMutation.executeMutation({ path })

  return {
    setActiveProject,
  }
}
