
declare module '@tooling/system-tests/lib/fixtures' {
  export function scaffold (): void
  export function scaffoldProject (project: string): void
  export function scaffoldWatch (): void
  export function remove (): void
  export function removeProject (name): void
  export function projectPath (name): string
  export function get (fixture, encoding: BufferEncoding = 'utf8'): string
  export function path (fixture): string
}
