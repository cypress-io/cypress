exports['browsers returns the expected list of browsers 1'] = [
  {
    "name": "chrome",
    "family": "chromium",
    "channel": "stable",
    "displayName": "Chrome",
    "versionRegex": {},
    "profile": true,
    "binary": [
      "google-chrome",
      "chrome",
      "google-chrome-stable"
    ]
  },
  {
    "name": "chromium",
    "family": "chromium",
    "channel": "dev",
    "displayName": "Chromium",
    "versionRegex": {},
    "profile": true,
    "binary": [
      "chromium-browser",
      "chromium"
    ]
  },
  {
    "name": "chrome",
    "family": "chromium",
    "channel": "canary",
    "displayName": "Canary",
    "versionRegex": {},
    "profile": true,
    "binary": "google-chrome-canary"
  },
  {
    "name":"edgeCanary",
    "family":"chrome",
    "displayName":"Edge Canary",
    "versionRegex":{},
    "profile":true,
    "binary":"edge-canary"
  },
  {
    "name":"edgeDev",
    "family":"chrome",
    "displayName":"Edge Dev",
    "versionRegex":{},
    "profile":true,
    "binary":"edge-dev"
  }
]
