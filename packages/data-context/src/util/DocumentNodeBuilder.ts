import type { DocumentNode, FragmentDefinitionNode, GraphQLResolveInfo } from 'graphql'

/**
 * Builds a DocumentNode from a given GraphQLResolveInfo payload
 *
 * Used to generate a fragment to push down into the client-side cache
 */
export class DocumentNodeBuilder {
  readonly frag: FragmentDefinitionNode
  readonly clientWriteFragment: DocumentNode

  constructor (info: Pick<GraphQLResolveInfo, 'fieldNodes' | 'parentType'>, isNode: boolean = false) {
    let selections = info.fieldNodes

    if (isNode) {
      selections = [{
        kind: 'Field',
        name: { kind: 'Name', value: 'id' },
      }, ...selections]
    }

    this.frag = {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'GeneratedFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: info.parentType.name },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections,
      },
    }

    // The fragment used to write into the
    this.clientWriteFragment = {
      kind: 'Document',
      definitions: [this.frag],
    }
  }

  get query (): DocumentNode {
    return {
      kind: 'Document',
      definitions: [
        this.frag,
        {
          kind: 'OperationDefinition',
          operation: 'query',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'FragmentSpread',
                name: { kind: 'Name', value: 'GeneratedFragment' },
              },
            ],
          },
        },
      ],
    }
  }

  get queryNode (): DocumentNode {
    return {
      kind: 'Document',
      definitions: [
        this.frag,
        {
          kind: 'OperationDefinition',
          operation: 'query',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'Field',
                name: {
                  kind: 'Name',
                  value: 'node',
                },
                arguments: [
                  {
                    kind: 'Argument',
                    name: { kind: 'Name', value: 'id' },
                    value: { kind: 'StringValue', value: 'PUSH_FRAGMENT_PLACEHOLDER' },
                  },
                ],
                selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                    {
                      kind: 'Field',
                      name: { kind: 'Name', value: '__typename' },
                    },
                    {
                      kind: 'Field',
                      name: { kind: 'Name', value: 'id' },
                    },
                    {
                      kind: 'FragmentSpread',
                      name: { kind: 'Name', value: 'GeneratedFragment' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
  }
}
