describe('Section 2', function () {
	it('Second task', function () {

		//go to website
		cy.visit('https://hiredscore.com')

		//hoover over about and click on careers
        cy.get('#w-dropdown-toggle-3').trigger('mouseover')
        cy.get('#w-dropdown-list-2 > [href="/press"]').click({force: true})

        //check the URL 
        cy.url().should('eq', 'https://www.hiredscore.com/press')

        //saving headlines in hl array
        let headline; 
        const hl = [];
        for (let i = 1; i < 4; i++) {
        	headline = `:nth-child(${i}) > .featured-posts__top-data > .featured-posts__title`
        	cy.get(headline).should(($div) => {
        		//adding the headline to the array
            	hl.push($div.text())

            	//testing: printing array to console 
            	console.log(hl[i-1])
            });
		}

		//write headlines array to CSV
        cy.writeFile('path/to/file.csv', hl)
    })
})