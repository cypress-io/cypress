import { graphqlSchema } from '@packages/graphql'
import { expect } from 'chai'
import dedent from 'dedent'
import { FieldNode, GraphQLObjectType, OperationDefinitionNode, parse, print } from 'graphql'
import { DocumentNodeBuilder } from '../../../src'

const CLOUD_VIEWER_QUERY = parse(`
query {
  cloudViewer {
    id
    fullName
    email
  }
}
`)

const CLOUD_PROJECT_QUERY = parse(`
query {
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
        recordKeys {
          id
          name
        }
      }
    }
  }
}
`)

describe('DocumentNodeBuilder', () => {
  it('frag: should generate a fragment', () => {
    const docNodeBuilder = new DocumentNodeBuilder({
      fieldNodes: ((CLOUD_VIEWER_QUERY.definitions[0] as OperationDefinitionNode).selectionSet.selections as ReadonlyArray<FieldNode>),
      parentType: graphqlSchema.getQueryType()!,
      variableDefinitions: [],
      operationName: 'CLOUD_VIEWER_QUERY',
    })

    expect(print(docNodeBuilder.frag)).to.eql(dedent`
      fragment GeneratedFragment on Query {
        cloudViewer {
          id
          fullName
          email
        }
      }
    `)
  })

  it('query: should create a query + fragment', () => {
    const docNodeBuilder = new DocumentNodeBuilder({
      fieldNodes: ((CLOUD_VIEWER_QUERY.definitions[0] as OperationDefinitionNode).selectionSet.selections as ReadonlyArray<FieldNode>),
      parentType: graphqlSchema.getQueryType()!,
      variableDefinitions: [],
      operationName: 'CLOUD_VIEWER_QUERY',
    })

    expect(print(docNodeBuilder.query).trimEnd()).to.eql(dedent`
      fragment GeneratedFragment on Query {
        cloudViewer {
          id
          fullName
          email
        }
      }

      query CLOUD_VIEWER_QUERY {
        ...GeneratedFragment
      }
    `)
  })

  it('queryNode: should create a node query + fragment', () => {
    const selections = ((CLOUD_PROJECT_QUERY.definitions[0] as OperationDefinitionNode).selectionSet.selections as ReadonlyArray<FieldNode>)

    const docNodeBuilder = new DocumentNodeBuilder({
      isNode: true,
      fieldNodes: (selections[0].selectionSet!.selections) as ReadonlyArray<FieldNode>,
      parentType: graphqlSchema.getType('CloudProject') as GraphQLObjectType,
      variableDefinitions: [],
      operationName: 'CLOUD_PROJECT_QUERY',
    })

    expect(print(docNodeBuilder.queryNode).trimRight()).to.eql(dedent`
      fragment GeneratedFragment on CloudProject {
        id
        cloudProject {
          __typename
          ... on CloudProject {
            id
            recordKeys {
              id
              name
            }
          }
        }
      }

      query CLOUD_PROJECT_QUERY {
        node(id: "PUSH_FRAGMENT_PLACEHOLDER") {
          __typename
          id
          ...GeneratedFragment
        }
      }
    `)
  })
})
