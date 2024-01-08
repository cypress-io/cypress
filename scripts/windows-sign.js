// This signing procedure only runs on windows binary builds to leverage remote signing in order to
// fullfil new requirements around OV and IV code signing.
// @see https://www.ssl.com/article/code-signing-key-storage-requirements-will-change-on-june-1-2023/ for more details.

// Signing delegation happens inside the electron-builder.json, which can be seen in the configuration:
// "sign": "./scripts/windows-sign.js"
// @see https://www.electron.build/configuration/win#how-do-delegate-code-signing for configuration reference.

// sampled from https://github.com/electron-userland/electron-builder/issues/6158#issuecomment-899798533
const path = require('path')
const { tmpdir } = require('os')
const fs = require('fs-extra')
const childProcess = require('child_process')

const TEMP_DIR = path.join(tmpdir(), 'release', 'tmp')

// create the temp directory we need for CodeSignTool in order to avoid manual confirmations
fs.ensureDirSync(TEMP_DIR)

function sign (configuration) {
  // credentials from ssl.com
  const USER_NAME = process.env.WINDOWS_SIGN_USER_NAME
  const USER_PASSWORD = process.env.WINDOWS_SIGN_USER_PASSWORD
  const CREDENTIAL_ID = process.env.WINDOWS_SIGN_CREDENTIAL_ID
  const USER_TOTP = process.env.WINDOWS_SIGN_USER_TOTP

  if (USER_NAME && USER_PASSWORD && USER_TOTP && CREDENTIAL_ID) {
    console.log(`Signing ${configuration.path}`)
    const { name, dir } = path.parse(configuration.path)

    // Since the CodeSignTool can only be run in the directory it is installed, we want to
    // download the CodeSignTool and explode it into the current directory. This isn't a repeat operation
    // in this case since we are only signing the executable, which is one file.
    console.log('downloading CodeSignTool for Windows from ssl.com...')
    childProcess.execSync('curl https://www.ssl.com/download/codesigntool-for-windows/ -o codesigntool-for-windows.zip')
    childProcess.execSync('tar -xvf codesigntool-for-windows.zip')
    childProcess.execSync('rm ./codesigntool-for-windows.zip')

    // CodeSignTool can't sign in place without verifying the overwrite with a
    // manual interaction so we are creating a new file in a temp directory and
    // then replacing the original file with the signed file.
    const tempFile = path.join(TEMP_DIR, name)

    console.log('executing signing...')
    // Sign the executable with the signing tool. For CLI reference, @see https://www.ssl.com/guide/esigner-codesigntool-command-guide/.
    childProcess.execSync(`CodeSignTool.bat sign -input_file_path="${configuration.path}" -output_dir_path="${TEMP_DIR}" -credential_id="${CREDENTIAL_ID}" -username="${USER_NAME}" -password="${USER_PASSWORD}" -totp_secret="${USER_TOTP}"`)

    console.log('signing complete! Moving signed files back to package directory...')
    childProcess.execSync(`mv "${tempFile}" "${dir}"`)
    console.log('move completed!')
  } else {
    console.warn(`windows-sign.js - Can't sign file ${configuration.path}, missing value for:
${USER_NAME ? '' : 'WINDOWS_SIGN_USER_NAME'}
${USER_PASSWORD ? '' : 'WINDOWS_SIGN_USER_PASSWORD'}
${CREDENTIAL_ID ? '' : 'WINDOWS_SIGN_CREDENTIAL_ID'}
${USER_TOTP ? '' : 'WINDOWS_SIGN_USER_TOTP'}
`)

    process.exit(1)
  }
}

exports.default = sign
