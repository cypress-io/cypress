it("Test running without browser config option", () => {
    cy.exec('cd default-browser-unset && npx cypress run --quiet').then((e) => {
        expect(e.stdout).to.contain('electron')
        expect(e.stdout).to.not.contain('chrome')
    })
})

it("Test running with browser: 'chrome' config option", () => {
    cy.exec('cd default-browser-chrome && npx cypress run --quiet').then((e) => {
        expect(e.stdout).to.contain('chrome')
        expect(e.stdout).to.not.contain('electron')
    })
})
