const { getChangesets, parseChangeset, userFacingChanges } = require('./changeset')

module.exports = async () => {
  let changeSetDetails
  const warnings = []
  const errs = []

  try {
    console.log('Getting changesets checked into Git.')
    const changesets = await getChangesets()

    console.log('There are', changesets.length, 'changes.')
    console.log('')

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
    process.exit(1)
  }

  return changeSetDetails
}
