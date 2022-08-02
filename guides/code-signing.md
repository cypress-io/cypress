# Code Signing

Code signing is done for the Windows and Mac distributions of Cypress when they are built in CI.

`electron-builder` handles code signing during the `create-build-artifacts` jobs. This guide assumes that the reader is already familiar with [`electron-builder`'s Code Signing documentation](https://www.electron.build/code-signing).

## Installing a new Mac code signing key

Follow the directions supplied by `electron-builder`: https://www.electron.build/code-signing#travis-appveyor-and-other-ci-servers

Set the environment variables `CSC_LINK` and `CSC_KEY_PASSWORD` in the `test-runner:sign-mac-binary` CircleCI context.

## Installing a new Windows code signing key

1. Obtain the private key and full certificate chain in ASCII-armored PEM format and store each in a file (`-----BEGIN PRIVATE KEY-----`, `-----BEGIN CERTIFICATE-----`)
2. Using `openssl`, convert the plaintext PEM public and private key to binary PKCS#12/PFX format and encrypt it with a real strong password.
    ```shell
    ➜ openssl pkcs12 -export -inkey key.pem -in cert.pem -out encrypted.pfx
    Enter Export Password: <password>
    Verifying - Enter Export Password: <password>
    ```
3. Upload the `encrypted.pfx` file to the Cypress App Google Drive and obtain a [direct download link](http://www.syncwithtech.org/p/direct-download-link-generator.html).
4. Within the `test-runner:sign-windows-binary` CircleCI context, set `CSC_LINK` to that URL and `CSC_KEY_PASSWORD` to the password.