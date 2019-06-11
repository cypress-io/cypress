exports['collected builds and copied desktop'] = {
  "lastBuilds": [
    {
      "platformArch": "darwin-x64",
      "s3zipPath": "beta/binary/3.3.0/darwin-x64/circle-develop-455046b928c861d4457b2ec5426a51de1fda74fd-102457/cypress.zip"
    }
  ],
  "testRunners": [
    {
      "platformArch": "darwin-x64",
      "s3zipPath": "desktop/3.3.0/darwin-x64/cypress.zip"
    }
  ]
}

exports['move-binaries parseBuildPath parses into SHA and build 1'] = {
  "path": "beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/",
  "parsed": {
    "commit": "47e98fa1d0b18867a74da91a719d0f1ae73fcbc7",
    "build": 101843,
    "s3path": "beta/binary/3.3.0/darwin-x64/circle-develop-47e98fa1d0b18867a74da91a719d0f1ae73fcbc7-101843/"
  }
}
