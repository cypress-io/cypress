exports['packages can copy files from package.json 1'] = {
  "[cwd]": {
    "packages": {
      "coffee": {
        "package.json": "{\"main\":\"src/main.js\", \"name\": \"foo\", \"files\": [\"lib\"]}",
        "src": {
          "main.js": "console.log()"
        },
        "lib": {
          "foo.js": "{}"
        }
      }
    }
  },
  "tmp": {
    "packages": {
      "coffee": {
        "package.json": "{\"main\":\"src/main.js\", \"name\": \"foo\", \"files\": [\"lib\"]}",
        "src": {
          "main.js": "console.log()"
        },
        "lib": {
          "foo.js": "{}"
        }
      }
    }
  }
}
