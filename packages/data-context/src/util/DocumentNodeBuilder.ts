import { DocumentNode, FieldNode, FragmentDefinitionNode, GraphQLResolveInfo, VariableDefinitionNode, visit } from 'graphql'

export interface RemoteQueryConfig {
  fieldNodes: FieldNode[]
  variableDefinitions: VariableDefinitionNode[]
}

/**
 * Builds a DocumentNode from a given GraphQLResolveInfo payload
 *
 * Used to generate a fragment to push down into the client-side cache
 */
export class DocumentNodeBuilder {
  readonly frag: FragmentDefinitionNode
  readonly clientWriteFragment: DocumentNode

  constructor (private info: Pick<GraphQLResolveInfo, 'fieldNodes' | 'parentType' | 'operation'> & {isNode?: boolean}) {
    let selections = info.fieldNodes

    if (info.isNode && !selections.some((s) => s.kind === 'Field' && s.name.value === 'id')) {
      selections = [{
        kind: 'Field',
        name: { kind: 'Name', value: 'id' },
      }, ...selections]
    }

    this.frag = {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'GeneratedFragment' },
      // variableDefinitions: info.operation?.variableDefinitions ?? [],
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

  /**
   * Finds all of the variables referenced within the field nodes, pulls these definitions
   * from the outer definition
   */
  getVariables (): VariableDefinitionNode[] {
    const seenVariables = new Set<string>()
    const variables: VariableDefinitionNode[] = []

    this.info.fieldNodes.map((node) => {
      visit(node, {
        Argument: (arg) => {
          if (arg.value.kind === 'Variable') {
            const variableName = arg.value.name.value

            if (!seenVariables.has(variableName)) {
              seenVariables.add(variableName)
              const def = this.info.operation.variableDefinitions?.find((d) => d.variable.name.value === variableName)

              if (def) {
                variables.push(def)
              }
            }
          }
        },
      })
    })

    return variables
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
          variableDefinitions: this.getVariables(),
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
