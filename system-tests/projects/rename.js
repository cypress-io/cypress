// const path = require('path')
const fs = require('fs')

const cwd = process.cwd()
const projects = fs.readdirSync(cwd)

const remove = ['.eslintrc.json', 'rename.js']

for (const p of projects.filter((x) => !remove.includes(x))) {
  const c = `${cwd}/${p}`
  const hasCyDir = fs.readdirSync(c)

  if (hasCyDir.includes('cypress') && fs.readdirSync(`${c}/cypress`).includes('integration')) {
    fs.renameSync(`${c}/cypress/e2e`, `${c}/cypress/e2e`)
  }
}
