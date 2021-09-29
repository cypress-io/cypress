import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'

function makeAddProjectQuery (query?: string) {
  const projectsQuery = `
    projects {
      id
      title
      projectId
      projectRoot
      isFirstTimeCT
      isFirstTimeE2E
    }
  `

  return gql`
    mutation addProject($path: String!) {
      addProject(path: $path) {
        ${query ? query : projectsQuery}
      }
    }
  `
}

/**
 * @param query Graphql query to select data from the App node in graphql
 * @returns addProject function to execute addProject mutation with provided path
 */
export function useAddProject (query?: string) {
  const addProjectMutation = useMutation(makeAddProjectQuery(query))

  const addProject = (path: string) => addProjectMutation.executeMutation({ path })

  return {
    addProject,
  }
}
