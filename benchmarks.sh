rm ./packages/server/results/startup.json
for (( i = 0; i <= 8; i++ )) ;
do 
  ( CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; ) 
done
