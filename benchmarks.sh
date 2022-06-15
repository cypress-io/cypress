./packages/snapshot/scripts/setup-prod

rm ./packages/server/results/startup-snapshot.json
for (( i = 0; i <= 8; i++ )) ; do PROJECT_BASE_DIR=`pwd` USE_SNAPSHOT=1 CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; done

rm ./packages/server/results/startup.json
for (( i = 0; i <= 8; i++ )) ; do PROJECT_BASE_DIR=`pwd` CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; done