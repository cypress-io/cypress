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

exports['transformRequires can find and replace symlink requires 1'] = {
  "[cwd]": {
    "build": {
      "linux": {
        "Cypress": {
          "resources": {
            "app": {
              "packages": {
                "foo": {
                  "package.json": "{\"main\":\"src/main.js\", \"name\": \"foo\", \"files\": [\"lib\"]}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../bar/src/main\")"
                  }
                },
                "bar": {
                  "package.json": "{\"main\":\"src/main.js\", \"name\": \"foo\", \"files\": [\"lib\"]}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../foo/lib/somefoo\")"
                  },
                  "node_modules": {
                    "no-search.js": ""
                  },
                  "dist": {
                    "no-search.js": ""
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "tmp": {}
}

exports['transformRequires can find and replace symlink requires on win32 1'] = {
  "[cwd]": {
    "build": {
      "linux": {
        "Cypress": {
          "resources": {
            "app": {
              "packages": {
                "foo": {
                  "package.json": "{\"main\":\"src/main.js\", \"name\": \"foo\", \"files\": [\"lib\"]}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../bar/src/main\")"
                  }
                },
                "bar": {
                  "package.json": "{\"main\":\"src/main.js\", \"name\": \"foo\", \"files\": [\"lib\"]}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../foo/lib/somefoo\")"
                  },
                  "node_modules": {
                    "no-search.js": ""
                  },
                  "dist": {
                    "no-search.js": ""
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "tmp": {}
}
