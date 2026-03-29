export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] ?? 0
    const vb = pb[i] ?? 0
    if (va > vb) return 1
    if (va < vb) return -1
  }
  return 0
}

export type PackageVulnerabilityBasicInfo = {
  id: string
  title: string
  severity: string
}

export type PackageVulnerability = PackageVulnerabilityBasicInfo & {
  [key: string]: any // Allow any other properties
}

export type PackageVulnerabilityPath = {
  projectName: string
  path: string[]
}

export type PackageVulnerabilityWithPaths = PackageVulnerabilityBasicInfo & {
  paths: PackageVulnerabilityPath[]
}

export type PackageVulnerabilityProject = {
  vulnerabilities: PackageVulnerability[]
  projectName: string
  [key: string]: any // Allow any other properties
}
