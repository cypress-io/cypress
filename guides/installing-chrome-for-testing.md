# Installing Chrome for Testing

Chrome for Testing (CfT) is the Chrome build Google publishes for automated testing: it doesn’t auto-update, and every version has its own download. You need it installed to run the internal Cypress suites in CfT on your machine. This guide covers how to install it and how Cypress finds it once it’s there.

## How Cypress identifies Chrome for Testing

Cypress detects CfT as a browser of its own, separate from Chrome. The definition lives in [`known-browsers.ts`](../packages/launcher/lib/known-browsers.ts).

- **`--browser` name:** `chrome-for-testing`
- **Display name:** Chrome for Testing
- **`Cypress.browser.name`:** `chrome-for-testing`, never `chrome`
- **`Cypress.browser.family`:** `chromium`

So a test that checks `Cypress.browser.name === 'chrome'` won’t match CfT. When any Chromium-based browser will do, check the family instead.

## Installing it

[`@puppeteer/browsers`](https://www.npmjs.com/package/@puppeteer/browsers) downloads CfT for your platform. By default it installs into a `chrome/` directory under the current working directory, so pass `--path` to keep it out of your checkout:

```bash
npx @puppeteer/browsers install chrome@stable --path ~/.cache/chrome-for-testing
```

PowerShell doesn’t expand `~` in arguments to other programs, so on Windows spell out the home directory:

```powershell
npx @puppeteer/browsers install chrome@stable --path "$HOME\.cache\chrome-for-testing"
```

When it finishes, it prints the version it installed and the absolute path to the executable, in the form `chrome@<version> <path>`. Under the `--path` directory, the executable lands here:

- **Linux x64:** `chrome/linux-<version>/chrome-linux64/chrome`
- **macOS (Apple silicon):** `chrome/mac_arm-<version>/chrome-mac-arm64/Google Chrome for Testing.app`
- **macOS (Intel):** `chrome/mac-<version>/chrome-mac-x64/Google Chrome for Testing.app`
- **Windows:** `chrome\win64-<version>\chrome-win64\chrome.exe`

Cypress doesn’t look in that directory, though. Each OS needs one more step before Cypress detects it.

## Making it detectable

### Linux

Detection runs `chrome --version` on the first binary named `chrome` on your `PATH`, and counts it as CfT when the output reads `Google Chrome for Testing <version>` ([`linux/index.ts`](../packages/launcher/lib/linux/index.ts)). Put the install directory first on `PATH`, in your shell profile if you want it to stick:

```bash
export PATH="$HOME/.cache/chrome-for-testing/chrome/linux-<version>/chrome-linux64:$PATH"
chrome --version   # Google Chrome for Testing <version>
```

Because detection only looks at the first `chrome` it finds, any other `chrome` earlier on your `PATH` hides CfT, and only one CfT version is detected at a time. If CfT fails to start because of missing system libraries, add `--install-deps` to the install command (it needs root).

### macOS

Detection asks Spotlight for the bundle ID `com.google.chrome.for.testing`, then falls back to `/Applications/Google Chrome for Testing.app` ([`darwin/index.ts`](../packages/launcher/lib/darwin/index.ts)). Spotlight may not have indexed the install directory, and detection checks `/Applications` either way, so copying the app there is the reliable option:

```bash
cp -R ~/.cache/chrome-for-testing/chrome/mac_arm-<version>/chrome-mac-arm64/"Google Chrome for Testing.app" /Applications/
```

On an Intel Mac, the app is under `mac-<version>/chrome-mac-x64` instead.

### Windows

Detection only checks `C:\Program Files\Google\Chrome for Testing\chrome.exe` and `C:\Program Files (x86)\Google\Chrome for Testing\chrome.exe` ([`windows/index.ts`](../packages/launcher/lib/windows/index.ts)). Copy the contents of `chrome-win64` into the first one, from an elevated PowerShell:

```powershell
New-Item -ItemType Directory -Force "C:\Program Files\Google\Chrome for Testing"
Copy-Item -Recurse "$HOME\.cache\chrome-for-testing\chrome\win64-<version>\chrome-win64\*" "C:\Program Files\Google\Chrome for Testing\"
```

## Pointing Cypress at the binary instead

`--browser` also takes a path to the executable, so Cypress doesn’t have to search for an installed copy. Reach for it when the steps above don’t fit:

- You can’t write to `/Applications` or `C:\Program Files`, for example on a managed machine without admin rights.
- You keep more than one CfT version and want to choose one per run. Detection finds only one, but a path picks exactly the build you name.
- Another `chrome` sits earlier on your Linux `PATH`, and you’d rather not reorder it.
- You only need CfT for a one-off run and don’t want to change your shell profile.

On Linux and macOS, Cypress runs `<path> --version` and resolves the result to `chrome-for-testing`, listing it as “Custom Chrome for Testing”. On macOS, give the executable inside the bundle, not the `.app` itself:

```bash
# Linux
yarn cypress:run -- --browser ~/.cache/chrome-for-testing/chrome/linux-<version>/chrome-linux64/chrome

# macOS (Apple silicon; on Intel, use mac-<version>/chrome-mac-x64)
yarn cypress:run -- --browser ~/.cache/chrome-for-testing/chrome/mac_arm-<version>/chrome-mac-arm64/"Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
```

Windows reads the version from the file’s metadata rather than its output, and treats any path ending in `chrome.exe` as Chrome. Add `:chrome-for-testing` to the path so Cypress picks the right browser:

```powershell
yarn cypress:run -- --browser "$HOME\.cache\chrome-for-testing\chrome\win64-<version>\chrome-win64\chrome.exe:chrome-for-testing"
```

## Checking which browser ran

Before you trust a result, check the run header. It should name Chrome for Testing, for example `Browser: Chrome for Testing 158 (headless)`. If it names Chrome, Chromium or Electron instead, Cypress picked up a different browser than you meant.

## Cloud agent containers

Some hosted containers already ship a CfT build. See [Cloud agent environments](../AGENTS.md#cloud-agent-environments) in `AGENTS.md` for how to reach it there.
