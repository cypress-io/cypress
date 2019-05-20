exports['packages can copy files from package.json 1'] = `
{
 "home": {
  "owner": {
   "dev": {
    "cypress": {
     "packages": {
      "coffee": {
       "package.json": {},
       "src": {
        "main.js": {}
       },
       "lib": {
        "foo.js": {}
       }
      }
     }
    }
   }
  }
 },
 "tmp": {
  "packages": {
   "coffee": {
    "package.json": {},
    "src": {
     "main.js": {}
    },
    "lib": {
     "foo.js": {}
    }
   }
  }
 }
}
`
