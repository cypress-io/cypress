import {
  PackageVulnerabilityProject,
  type PackageVulnerabilityWithPaths,
} from './vuln-utils'

export function extractPackageVulnerabilities(
  data: PackageVulnerabilityProject[]
): Record<string, PackageVulnerabilityWithPaths> {
  // Use a Set to automatically track unique values
  const vulnerabilities: Record<string, PackageVulnerabilityWithPaths> = {}

  // Iterate through each project
  data.forEach((project) => {
    // Check if vulnerabilities array exists and has items
    if (project.vulnerabilities && Array.isArray(project.vulnerabilities)) {
      // Add each vulnerability ID to the Set
      project.vulnerabilities.forEach((vuln) => {
        if (vuln.id) {
          if (vuln.id in vulnerabilities) {
            vulnerabilities[vuln.id].paths.push({
              path: vuln.from?.slice(1) || [],
              projectName: project.projectName,
            })
          } else {
            vulnerabilities[vuln.id] = {
              title: vuln.title,
              id: vuln.id,
              severity: vuln.severity,
              paths: [
                {
                  path: vuln.from?.slice(1) || [], // Ensure 'from' is an array or empty array
                  projectName: project.projectName,
                },
              ],
            }
          }
        }
      })
    }
  })

  // Convert Set to Array and return
  return vulnerabilities
}
