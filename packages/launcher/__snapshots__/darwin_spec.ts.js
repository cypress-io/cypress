exports['darwin browser detection detects browsers as expected 1'] = [
  {
    "name": "chrome",
    "family": "chromium",
    "channel": "stable",
    "displayName": "Chrome",
    "versionRegex": {},
    "binary": [
      "google-chrome",
      "chrome",
      "google-chrome-stable"
    ],
    "minSupportedVersion": 64,
    "path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Google Chrome.app",
      "executable": "Contents/MacOS/Google Chrome",
      "appId": "com.google.Chrome",
      "versionProperty": "KSVersion"
    }
  },
  {
    "name": "chromium",
    "family": "chromium",
    "channel": "stable",
    "displayName": "Chromium",
    "versionRegex": {},
    "binary": [
      "chromium-browser",
      "chromium"
    ],
    "minSupportedVersion": 64,
    "path": "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Chromium.app",
      "executable": "Contents/MacOS/Chromium",
      "appId": "org.chromium.Chromium",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "chrome",
    "family": "chromium",
    "channel": "beta",
    "displayName": "Chrome Beta",
    "versionRegex": {},
    "binary": "google-chrome-beta",
    "minSupportedVersion": 64,
    "path": "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Google Chrome Beta.app",
      "executable": "Contents/MacOS/Google Chrome Beta",
      "appId": "com.google.Chrome.beta",
      "versionProperty": "KSVersion"
    }
  },
  {
    "name": "chrome",
    "family": "chromium",
    "channel": "canary",
    "displayName": "Canary",
    "versionRegex": {},
    "binary": "google-chrome-canary",
    "minSupportedVersion": 64,
    "path": "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Google Chrome Canary.app",
      "executable": "Contents/MacOS/Google Chrome Canary",
      "appId": "com.google.Chrome.canary",
      "versionProperty": "KSVersion"
    }
  },
  {
    "name": "firefox",
    "family": "firefox",
    "channel": "stable",
    "displayName": "Firefox",
    "versionRegex": {},
    "binary": "firefox",
    "minSupportedVersion": 86,
    "path": "/Applications/Firefox.app/Contents/MacOS/firefox",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Firefox.app",
      "executable": "Contents/MacOS/firefox",
      "appId": "org.mozilla.firefox",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "firefox",
    "family": "firefox",
    "channel": "dev",
    "displayName": "Firefox Developer Edition",
    "versionRegex": {},
    "binary": [
      "firefox-developer-edition",
      "firefox"
    ],
    "minSupportedVersion": 86,
    "path": "/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Firefox Developer Edition.app",
      "executable": "Contents/MacOS/firefox",
      "appId": "org.mozilla.firefoxdeveloperedition",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "firefox",
    "family": "firefox",
    "channel": "nightly",
    "displayName": "Firefox Nightly",
    "versionRegex": {},
    "binary": [
      "firefox-nightly",
      "firefox-trunk"
    ],
    "minSupportedVersion": 86,
    "path": "/Applications/Firefox Nightly.app/Contents/MacOS/firefox",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Firefox Nightly.app",
      "executable": "Contents/MacOS/firefox",
      "appId": "org.mozilla.nightly",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "edge",
    "family": "chromium",
    "channel": "stable",
    "displayName": "Edge",
    "versionRegex": {},
    "binary": [
      "edge",
      "microsoft-edge"
    ],
    "minSupportedVersion": 79,
    "path": "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Microsoft Edge.app",
      "executable": "Contents/MacOS/Microsoft Edge",
      "appId": "com.microsoft.Edge",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "edge",
    "family": "chromium",
    "channel": "canary",
    "displayName": "Edge Canary",
    "versionRegex": {},
    "binary": "edge-canary",
    "minSupportedVersion": 79,
    "path": "/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Microsoft Edge Canary.app",
      "executable": "Contents/MacOS/Microsoft Edge Canary",
      "appId": "com.microsoft.Edge.Canary",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "edge",
    "family": "chromium",
    "channel": "beta",
    "displayName": "Edge Beta",
    "versionRegex": {},
    "binary": "edge-beta",
    "minSupportedVersion": 79,
    "path": "/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Microsoft Edge Beta.app",
      "executable": "Contents/MacOS/Microsoft Edge Beta",
      "appId": "com.microsoft.Edge.Beta",
      "versionProperty": "CFBundleShortVersionString"
    }
  },
  {
    "name": "edge",
    "family": "chromium",
    "channel": "dev",
    "displayName": "Edge Dev",
    "versionRegex": {},
    "binary": [
      "edge-dev",
      "microsoft-edge-dev"
    ],
    "minSupportedVersion": 79,
    "path": "/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev",
    "version": "someVersion",
    "findAppParams": {
      "appName": "Microsoft Edge Dev.app",
      "executable": "Contents/MacOS/Microsoft Edge Dev",
      "appId": "com.microsoft.Edge.Dev",
      "versionProperty": "CFBundleShortVersionString"
    }
  }
]
