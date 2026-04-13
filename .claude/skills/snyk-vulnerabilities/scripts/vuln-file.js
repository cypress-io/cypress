function extractPackageVulnerabilities(data) {
  const vulnerabilities = {}

  data.forEach((project) => {
    if (project.vulnerabilities && Array.isArray(project.vulnerabilities)) {
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
                  path: vuln.from?.slice(1) || [],
                  projectName: project.projectName,
                },
              ],
            }
          }
        }
      })
    }
  })

  return vulnerabilities
}

module.exports = { extractPackageVulnerabilities }
