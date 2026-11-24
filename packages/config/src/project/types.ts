export type Config = Record<string, any>

export type GetFilesByGlob = (cwd: string, glob: string | string[]) => Promise<string[]>
