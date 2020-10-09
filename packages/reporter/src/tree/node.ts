export interface Node {
  id: string
  type: 'test' | 'suite' | 'command-log-section' | 'agent' | 'route' | 'command' | 'test-error'
  children?: Node[]
}
