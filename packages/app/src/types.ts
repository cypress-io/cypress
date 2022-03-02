export interface ResolvedConfigProp {
  field: string
  from: 'default'| 'config' | 'plugin' | 'env'
  value: string | number | boolean | Record<string, string> | Array<string>
}

export type CypressResolvedConfig = ResolvedConfigProp[]
