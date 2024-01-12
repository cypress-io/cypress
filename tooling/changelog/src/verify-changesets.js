const { getChangesets, parseChangeset, userFacingChanges } = require('./changeset')
const { exit } = require('process')

module.exports = async () => {
  let changeSetDetails
  const warnings = []
  const errs = []

  try {
    const changesets = await getChangesets()

    console.log('There are', changesets.length, 'changes.\n  -', changesets.join('\n  - '))

    const promises = changesets.map((changeset) => {
      return parseChangeset(changeset)
      .then((details) => {
        if (!Object.keys(userFacingChanges).includes(details.type)) {
          warnings.push(`${changeset} has type ${details.type}, which does not require a changeset. This will not get added to the changelog once it is generated. Change to be type of`)
        }

        return details
      })
      .catch((err) => {
        errs.push(err)
      })
    })

    changeSetDetails = await Promise.all(promises)
  } catch (err) {
    errs.push(err)
  }

  if (warnings.length) {
    warnings.forEach((warn) => console.warn(warn))
  }

  if (errs.length) {
    errs.forEach((err) => console.error(err))
    exit(1)
  }

  console.log()

  return changeSetDetails
}
