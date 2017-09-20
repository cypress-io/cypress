exports['lib/preprocessor #getFile uses default preprocessor if none registered 1'] = {
  "extensions": [
    ".js",
    ".jsx",
    ".coffee",
    ".cjsx"
  ],
  "watchifyOptions": {
    "ignoreWatch": [
      "**/.git/**",
      "**/.nyc_output/**",
      "**/.sass-cache/**",
      "**/bower_components/**",
      "**/coverage/**",
      "**/node_modules/**"
    ]
  },
  "transforms": [
    {
      "options": {}
    },
    {
      "options": {
        "ast": false,
        "babelrc": false,
        "plugins": [
          null
        ],
        "presets": [
          null,
          {
            "presets": [
              {
                "plugins": [
                  null
                ]
              }
            ],
            "plugins": [
              null,
              null,
              null
            ],
            "env": {
              "development": {
                "plugins": []
              }
            }
          }
        ]
      }
    }
  ]
}

