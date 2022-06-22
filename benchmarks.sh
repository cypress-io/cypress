rm ./packages/server/results/startup.json
yarn webpack
for (( i = 0; i <= 8; i++ )) ;
do 
  ( CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; ) 
done

PROFILE_IND=1 CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress;

export MINIFY_IND=1

rm ./packages/server/results/startup-minify.json
yarn webpack
for (( i = 0; i <= 8; i++ )) ;
do 
  ( CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; ) 
done

PROFILE_IND=1 CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress;
