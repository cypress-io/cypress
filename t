[1mdiff --git a/packages/launchpad/cypress/e2e/migration.cy.ts b/packages/launchpad/cypress/e2e/migration.cy.ts[m
[1mindex 269ea98061..63461b4d9b 100644[m
[1m--- a/packages/launchpad/cypress/e2e/migration.cy.ts[m
[1m+++ b/packages/launchpad/cypress/e2e/migration.cy.ts[m
[36m@@ -32,6 +32,7 @@[m [mdescribe('Steps', () => {[m
     cy.get(renameSupportStep).should('not.exist')[m
     cy.get(setupComponentStep).should('not.exist')[m
     cy.get(configFileStep).should('exist')[m
[32m+[m[32m    cy.wait(110000)[m
   })[m
 [m
   it('shows all e2e steps for an e2e project with all defaults', () => {[m
[36m@@ -46,16 +47,30 @@[m [mdescribe('Steps', () => {[m
     cy.get(setupComponentStep).should('not.exist')[m
   })[m
 [m
[31m-  it('shows all e2e steps for an e2e project with custom testFiles', () => {[m
[31m-    cy.scaffoldProject('migration-e2e-custom-test-files')[m
[31m-    cy.openProject('migration-e2e-custom-test-files')[m
[32m+[m[32m  // TODO: the current logic is wrong and does not consider[m
[32m+[m[32m  // the case of a custom integration folder![m
[32m+[m[32m  it.skip('shows all e2e steps for an e2e project with custom integrationFolder', () => {[m
[32m+[m[32m    cy.scaffoldProject('migration-e2e-custom-integration')[m
[32m+[m[32m    cy.openProject('migration-e2e-custom-integration')[m
     cy.visitLaunchpad()[m
     cy.waitForWizard()[m
[32m+[m
     cy.get(renameAutoStep).should('exist')[m
     cy.get(renameManualStep).should('not.exist')[m
     cy.get(renameSupportStep).should('exist')[m
     cy.get(configFileStep).should('exist')[m
     cy.get(setupComponentStep).should('not.exist')[m
[32m+[m
[32m+[m[32m    cy.contains('src/basic.spec.js')[m
[32m+[m[32m    cy.contains('src/basic.cy.js')[m
[32m+[m
[32m+[m[32m    cy.get('button').contains('Rename these specs for me').click()[m
[32m+[m[32m    // wait for a bit to make sure the file was actually move before[m
[32m+[m[32m    // asserting it exists[m
[32m+[m[32m    cy.wait(100)[m
[32m+[m[32m    cy.withCtx(ctx => {[m
[32m+[m[32m      ctx.actions.file.checkIfFileExists('src/basic.cy.js')[m
[32m+[m[32m    })[m
   })[m
 [m
   it('shows all e2e steps for an e2e project with custom testFiles', () => {[m
