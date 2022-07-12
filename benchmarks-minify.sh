export MINIFY_IND=1

rm ./packages/server/results/startup-minify.json
yarn webpack
for (( i = 0; i <= 8; i++ )) ;
do 
  ( BENCH_IND=1 CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; ) 
done

PROFILE_IND=1 CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress;

export USE_SNAPSHOT=1

# rm ./packages/server/results/startup-snapshot.json
# node packages/snapshot/scripts/setup-prod
# for (( i = 0; i <= 8; i++ )) ;
# do 
#   ( BENCH_IND=1 PROJECT_BASE_DIR=`pwd` CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; ) 
# done

# PROFILE_IND=1 PROJECT_BASE_DIR=`pwd` CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress;

unset USE_SNAPSHOT
export USE_VANILLA_SNAPSHOT=1

rm ./packages/server/results/startup-minify-vanilla-snapshot.json
PROJECT_BASE_DIR=`pwd` node ./generate-snapshot.js   
for (( i = 0; i <= 8; i++ )) ;
do 
  ( BENCH_IND=1 PROJECT_BASE_DIR=`pwd` CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress; ) 
done

PROFILE_IND=1 PROJECT_BASE_DIR=`pwd` CYPRESS_INTERNAL_ENV=development ./packages/electron/dist/Cypress/Cypress.app/Contents/MacOS/Cypress;
