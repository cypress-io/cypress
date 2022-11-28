import { DocumentNode, FieldNode, FragmentDefinitionNode, GraphQLResolveInfo, VariableDefinitionNode, visit } from 'graphql'

export interface RemoteQueryConfig {
  fieldNodes: FieldNode[]
  variableDefinitions: VariableDefinitionNode[]
}

export type DocumentNodeBuilderParams = Pick<GraphQLResolveInfo, 'fieldNodes' | 'parentType'> & {isNode?: boolean, isRemoteFetchable?: boolean, variableDefinitions: readonly VariableDefinitionNode[] | undefined, operationName: string}

/**
 * Builds a DocumentNode from a given GraphQLResolveInfo payload
 *
 * Used to generate a fragment to push down into the client-side cache
 */
export class DocumentNodeBuilder {
  readonly frag: FragmentDefinitionNode
  readonly clientWriteFragment: DocumentNode
  readonly variables: VariableDefinitionNode[]
  readonly #variableNames: Set<string>

  constructor (private info: DocumentNodeBuilderParams) {
    const selections = this.#withRequiredFields(info)

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

    this.#variableNames = new Set<string>()
    this.variables = []

    /**
     * Finds all of the variables referenced within the field nodes, pulls these definitions
     * from the outer definition
     */
    this.info.fieldNodes.map((node) => {
      visit(node, {
        Argument: (arg) => {
          if (arg.value.kind === 'Variable') {
            const variableName = arg.value.name.value

            if (!this.#variableNames.has(variableName)) {
              this.#variableNames.add(variableName)
              const def = this.info.variableDefinitions?.find((d) => d.variable.name.value === variableName)

              if (def) {
                this.variables.push(def)
              }
            }
          }
        },
      })
    })
  }

  #withRequiredFields (params: DocumentNodeBuilderParams) {
    let selections: FieldNode[] = [...params.fieldNodes]

    if ((params.isNode || params.isRemoteFetchable) && !selections.some((s) => s.kind === 'Field' && s.name.value === 'id')) {
      selections = [{
        kind: 'Field',
        name: { kind: 'Name', value: 'id' },
      }, ...selections]
    }

    if (params.isRemoteFetchable) {
      if (!selections.some((s) => s.kind === 'Field' && s.name.value === 'fetchingStatus')) {
        selections = [{
          kind: 'Field',
          name: { kind: 'Name', value: 'fetchingStatus' },
        }, ...selections]
      }

      if (!selections.some((s) => s.kind === 'Field' && s.name.value === 'error')) {
        selections = [{
          kind: 'Field',
          name: { kind: 'Name', value: 'error' },
        }, ...selections]
      }
    }

    return selections
  }

  get variableNames () {
    return Array.from(this.#variableNames)
  }

  get query (): DocumentNode {
    return {
      kind: 'Document',
      definitions: [
        this.frag,
        {
          kind: 'OperationDefinition',
          operation: 'query',
          name: {
            kind: 'Name',
            value: this.info.operationName,
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'FragmentSpread',
                name: { kind: 'Name', value: 'GeneratedFragment' },
              },
            ],
          },
          variableDefinitions: this.variables,
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
          name: {
            kind: 'Name',
            value: this.info.operationName,
          },
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
          variableDefinitions: this.variables,
        },
      ],
    }
  }
}
