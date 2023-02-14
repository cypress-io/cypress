# Code Signing

Code signing is done for the Windows and Mac distributions of Cypress when they are built in CI.

`electron-builder` handles code signing during the `create-build-artifacts` jobs. This guide assumes that the reader is already familiar with [`electron-builder`'s Code Signing documentation](https://www.electron.build/code-signing).

## Rotating the Mac code signing key

1. On a Mac, log in to Xcode using Cypress's Apple developer program identity.
2. Follow Apple's [Create, export, and delete signing certificates](https://help.apple.com/xcode/mac/current/#/dev154b28f09) instructions:
    1. Follow "View signing certificates".
    2. Follow "Create a signing certificate", and choose the type of "Developer ID Application" when prompted.
    3. Follow "Export a signing certificate". Set a strong passphrase when prompted, which will later become `CSC_KEY_PASSWORD`.
3. Upload the exported, encrypted `.p12` file to the [Code Signing folder][code-signing-folder] in Google Drive and obtain a public [direct download link][direct-download].
4. Within the `test-runner:sign-mac-binary` CircleCI context, set `CSC_LINK` to that direct download URL and set `CSC_KEY_PASSWORD` to the passphrase used to encrypt the `p12` file.

## Rotating the Windows code signing key

1. Generate a certificate signing request (CSR) file using `openssl`. For example:
    ```shell
    # generate a new private key
    openssl genrsa -out win-code-signing.key 4096
    # create a CSR using the private key
    openssl req -new -key win-code-signing.key -out win-code-signing.csr
    ```
2. Obtain a certificate by submitting the CSR to SSL.com using the Cypress SSL.com account.
    * If renewing, follow the [renewal instructions](https://www.ssl.com/how-to/renewing-ev-ov-and-iv-certificates/).
    * If rotating, contact SSL.com's support to request certificate re-issuance.
3. Obtain the full certificate chain from SSL.com's dashboard in ASCII-armored PEM format and save it as `win-code-signing.crt`. (`-----BEGIN PRIVATE KEY-----`, `-----BEGIN CERTIFICATE-----`)
4. Using `openssl`, convert the plaintext PEM public and private key to binary PKCS#12/PFX format and encrypt it with a strong passphrase, which will later become `CSC_KEY_PASSWORD`.
    ```shell
    ➜ openssl pkcs12 -export -inkey win-code-signing.key -in win-code-signing.crt -out encrypted-win-code-signing.pfx
    Enter Export Password: <password>
    Verifying - Enter Export Password: <password>
    ```
5. Upload the `encrypted-win-code-signing.pfx` file to the [Code Signing folder][code-signing-folder] in Google Drive and obtain a public [direct download link][direct-download].
6. Within the `test-runner:sign-windows-binary` CircleCI context, set `CSC_LINK` to that direct download URL and set `CSC_KEY_PASSWORD` to the passphrase used to encrypt the `pfx` file.

[direct-download]: https://www.syncwithtech.org/p/direct-download-link-generator.html
[code-signing-folder]: https://drive.google.com/drive/u/1/folders/1CsuoXRDmXvd3ImvFI-sChniAMJBASUW
