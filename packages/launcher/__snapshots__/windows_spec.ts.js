exports['windows browser detection detects browsers as expected 1'] = [
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
    "path": "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "version": "1.2.3",
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
    "path": "C:/Program Files (x86)/Google/chrome-win32/chrome.exe",
    "version": "2.3.4",
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
    "channel": "canary",
    "displayName": "Canary",
    "versionRegex": {},
    "binary": "google-chrome-canary",
    "path": "C:/Users/flotwig/AppData/Local/Google/Chrome SxS/Application/chrome.exe",
    "version": "3.4.5",
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
    "path": "C:/Program Files/Mozilla Firefox/firefox.exe",
    "version": "72",
    "findAppParams": {
      "appName": "Firefox.app",
      "executable": "Contents/MacOS/firefox-bin",
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
    "path": "C:/Program Files (x86)/Firefox Developer Edition/firefox.exe",
    "version": "73",
    "findAppParams": {
      "appName": "Firefox Developer Edition.app",
      "executable": "Contents/MacOS/firefox-bin",
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
    "path": "C:/Program Files/Firefox Nightly/firefox.exe",
    "version": "74",
    "findAppParams": {
      "appName": "Firefox Nightly.app",
      "executable": "Contents/MacOS/firefox-bin",
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
    "path": "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "version": "11",
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
    "path": "C:/Users/flotwig/AppData/Local/Microsoft/Edge SxS/Application/msedge.exe",
    "version": "14",
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
    "path": "C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe",
    "version": "12",
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
    "path": "C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe",
    "version": "13",
    "findAppParams": {
      "appName": "Microsoft Edge Dev.app",
      "executable": "Contents/MacOS/Microsoft Edge Dev",
      "appId": "com.microsoft.Edge.Dev",
      "versionProperty": "CFBundleShortVersionString"
    }
  }
]

exports['windows browser detection detects new Chrome 64-bit app path 1'] = {
  "name": "chrome",
  "version": "4.4.4",
  "path": "C:/Program Files/Google/Chrome/Application/chrome.exe"
}

exports['windows browser detection detects local Firefox installs 1'] = [
  {
    "name": "firefox",
    "family": "firefox",
    "channel": "stable",
    "displayName": "Firefox",
    "versionRegex": {},
    "binary": "firefox",
    "path": "C:/Users/flotwig/AppData/Local/Mozilla Firefox/firefox.exe",
    "version": "100",
    "findAppParams": {
      "appName": "Firefox.app",
      "executable": "Contents/MacOS/firefox-bin",
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
    "path": "C:/Users/flotwig/AppData/Local/Firefox Developer Edition/firefox.exe",
    "version": "300",
    "findAppParams": {
      "appName": "Firefox Developer Edition.app",
      "executable": "Contents/MacOS/firefox-bin",
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
    "path": "C:/Users/flotwig/AppData/Local/Firefox Nightly/firefox.exe",
    "version": "200",
    "findAppParams": {
      "appName": "Firefox Nightly.app",
      "executable": "Contents/MacOS/firefox-bin",
      "appId": "org.mozilla.nightly",
      "versionProperty": "CFBundleShortVersionString"
    }
  }
]
