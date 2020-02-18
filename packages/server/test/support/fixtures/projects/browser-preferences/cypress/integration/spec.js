/// <reference types="cypress" />

context('before:browser:launch preferences', () => {
  // does not work for electron
  it('download location preference - downloads to the correct location', () => {
    const rows = [
      ['name1', 'city1', 'some other info'],
      ['name2', 'city2', 'more info'],
    ]

    const csvContent = `data:text/csv;charset=utf-8,${
      rows.map((e) => e.join(',')).join('\n')}`

    const encodedUri = encodeURI(csvContent)

    let link = document.createElement('a')

    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'my_data.csv')
    document.body.appendChild(link) // Required for FF

    // This will download the data file named "my_data.csv".
    link.click()

    // ensure we downloaded to the correct directory.
    cy.readFile('cypress/downloads/my_data.csv')
  })
})
