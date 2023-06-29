it("Test running without defaultBrowser", () => {
    cy.exec('cd default-browser-unset && npx cypress run --quiet').then((e) => {
        expect(e.stdout).to.contain('electron')
        expect(e.stdout).to.not.contain('chrome')
    })
})

it("Test running with defaultBrowser: 'chrome'", () => {
    cy.exec('cd default-browser-chrome && npx cypress run --quiet').then((e) => {
        expect(e.stdout).to.contain('chrome')
        expect(e.stdout).to.not.contain('electron')
    })
})
