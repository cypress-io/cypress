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

exports['packages can copy files with local npm dependencies 1'] = {
  "[cwd]": {
    "npm": {
      "package-a": {
        "package.json": "{\"main\":\"src/index.js\",\"name\":\"@cypress/package-a\",\"files\":[\"lib\"]}",
        "src": {
          "index.js": "console.error()"
        },
        "lib": {
          "bar.js": "{}"
        }
      }
    },
    "packages": {
      "coffee": {
        "package.json": "{\"main\":\"src/main.js\",\"name\":\"foo\",\"files\":[\"lib\"],\"dependencies\":{\"@cypress/package-a\":\"0.0.0-development\"}}",
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
    "npm": {
      "package-a": {
        "package.json": "{\"main\":\"src/index.js\",\"name\":\"@cypress/package-a\",\"files\":[\"lib\"]}",
        "src": {
          "index.js": "console.error()"
        },
        "lib": {
          "bar.js": "{}"
        }
      }
    },
    "packages": {
      "coffee": {
        "package.json": "{\"main\":\"src/main.js\",\"name\":\"foo\",\"files\":[\"lib\"],\"dependencies\":{\"@cypress/package-a\":\"0.0.0-development\"}}",
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

exports['transformRequires can find and replace symlink requires including nested local npm packages 1'] = {
  "[cwd]": {
    "build": {
      "linux": {
        "Cypress": {
          "resources": {
            "app": {
              "npm": {
                "package-a": {
                  "package.json": "{\"main\":\"src/main.js\",\"name\":\"foo\",\"files\":[\"lib\"],\"dependencies\":{\"@cypress/package-b\":\"0.0.0-development\"}}",
                  "src": {
                    "main.js": "console.error()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../package-b/src/main\")"
                  }
                },
                "package-b": {
                  "package.json": "{\"main\":\"src/main.js\",\"name\":\"foo\",\"files\":[\"lib\"],\"dependencies\":{\"@cypress/package-c\":\"0.0.0-development\"}}",
                  "src": {
                    "main.js": "console.warn()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../package-c/src/main\")"
                  }
                },
                "package-c": {
                  "package.json": "{\"main\":\"src/main.js\",\"name\":\"foo\",\"files\":[\"lib\"],\"dependencies\":{\"lodash\":\"1.0.0\"}}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"@cypress/package-d/src/main\")"
                  }
                }
              },
              "packages": {
                "foo": {
                  "package.json": "{\"main\":\"src/main.js\",\"name\":\"foo\",\"files\":[\"lib\"],\"dependencies\":{\"@cypress/package-a\":\"0.0.0-development\"}}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../bar/src/main\")",
                    "baz.js": "require(\"../../../npm/package-a/src/main\")"
                  }
                },
                "bar": {
                  "package.json": "{\"main\":\"src/main.js\",\"name\":\"bar\",\"files\":[\"lib\"],\"dependencies\":{\"@cypress/package-b\":\"0.0.0-development\"}}",
                  "src": {
                    "main.js": "console.log()"
                  },
                  "lib": {
                    "foo.js": "require(\"../../foo/lib/somefoo\")",
                    "baz.js": "require(\"../../../npm/package-b/lib/somefoo\")"
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
