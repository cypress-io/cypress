"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptResponse = exports.encryptRequest = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const util_1 = require("util");
const jose_1 = require("jose");
const base64url_1 = tslib_1.__importDefault(require("base64url"));
const zlib_1 = require("zlib");
const deflateRaw = (0, util_1.promisify)(zlib_1.deflateRaw);
const CY_STAGING = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFxZE1OazZYVkFhV3VlT0lXZ3V2aQpDTlhPRGVtMHRINmo0NnFTWUhJZFcyU1N5NHU0ZFpGd1VHQldlZjBEbDVmeGhZa1BFczBxUDJHUnlUZnY5YjNXCk9xWEJFQmFyNXMyYzJSMGd1RzdqNGtidTlZZklRQWpWejZndUtQMTIzd3VKSjFmcEU5T3pXWlZmUi9pQWl4b1gKTi82aEFhSHNMT1RlNXROdTVESzNOQnUxa3VJTTExcDZScEo5bGgvbWVFK3JObzRZVWUvZ2Jzam1mZmJiODRGeQpqWk1sQW9YSnYxU3lKK2phdTNMa3JkdzMybWYrczMyd2NLUnNpbmp1STgrZndDT2lEb2xnZW9NdEhta2tXVS8xCnJvUnVEcGd6d2FZemxLbUhRODNWQTlOTUhvNmMwVU40MzlBMnVtRFQ4ek94SjJjQUY0U0RiWTV3RnBnd3cvUVgKd1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`;
const CY_DEVELOPMENT = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF3aEpiaG1pbHJsT012V3V4WHdWcAp2MWZBSUZWNGlrcS8vOGhNdFpCbVk1WDRaNjVwQ3pqZjJzYVNXSnJVWExMd1R4d3VpOGlFd3hCb2Jlelc0d1ZsCk9xYjlEWE5RbnFvd2hrcGZNUmlhTjM0ZEtYZHZLZi9RaFAvU2tJbVFCYi9EQzFISWdhYjRXZGpJOFlwZnhHQWoKdkJhbU1TcEErVGdDekVGaWRuR3p6OUk5SmY0bUVBTHdIT3NGaVh3NkpqMmlXeDZBT1JtR3FBL3FYWStPY25wdQo1dmxISEl3cllxU1hQZjU2OHRUV2dZOVNvK0ZmYVhlK2s0MnZGeDAyRjdGRXlCZmJxMnBNdjhJWWJnbDViaE0rClRjUFVEYnpBZ0FWNUhlRENKKzQ2RklLNW9JZHV5WjhXQUQxRGFJRTQyWHBGNjlhWjRkcE11YnR5VDBIbXBHeHIKM3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`;
const CY_PRODUCTION = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUE5dm5nWG1mdU51dnpnckJ3bHRLdApOZVQwYy9WYlZCWTRkZlZIaVBiQXF1Z3l2dndSUWFseVJ4SjNUdDgxL28vMXhyTXIyUUNtbXRkOVllTXA5dmVzClVqd1BuQnZucEIrWGo0ZXVoR2VVY0Q4Unhxb0cxdmFFd294ajFsSWFIckwrUVBBVGVPNFJ0Q3EweFM4TlduaGoKK1NYYm13NjNjWGtYZGthYzdlQVJmdmt2QjVMU1VqR290eXhPZGpOZmp2SmtvTU1GYXlqUGpSMGpFQldBL3NPZApFOENUTFRKdkYzakF0ODVpSDBHYWNpQVhJUG1uUnJ2eEh0SS9seDNWNkk0T1dNeG45SDRRWStoMnFmV2N2bWlQCmsrL1FNMjQ5cW4zKzgvQnNRWHNEVXZOMWdwZk9nRUIxRTFRaWJMZVV1YVducE05YWRWZENzWEVvRS8xUHduZTIKMFFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`;
const keys = {
    development: CY_DEVELOPMENT,
    staging: CY_STAGING,
    production: CY_PRODUCTION,
};
const keyObjects = {};
function getPublicKey() {
    const env = process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development';
    if (!keyObjects[env]) {
        keyObjects[env] = crypto_1.default.createPublicKey(Buffer.from(keys[env], 'base64').toString('utf8').trim());
    }
    return keyObjects[env];
}
// Implements the https://www.rfc-editor.org/rfc/rfc7516 spec
// Functionally equivalent to the behavior for AES-256-GCM encryption
// in the jose library (https://github.com/panva/jose/blob/main/src/jwe/general/encrypt.ts),
// but allows us to keep track of the encrypting key locally, to optionally use it for decryption
// of encrypted payloads coming back in the response body.
async function encryptRequest(params, publicKey) {
    const key = publicKey || getPublicKey();
    const header = (0, base64url_1.default)(JSON.stringify({ alg: 'RSA-OAEP', enc: 'A256GCM', zip: 'DEF' }));
    const deflated = await deflateRaw(JSON.stringify(params.body));
    const iv = crypto_1.default.randomBytes(12);
    const secretKey = crypto_1.default.createSecretKey(crypto_1.default.randomBytes(32));
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', secretKey, iv, { authTagLength: 16 });
    const aad = new util_1.TextEncoder().encode(header);
    cipher.setAAD(aad, {
        plaintextLength: deflated.length,
    });
    const encrypted = cipher.update(deflated);
    cipher.final();
    // Returns the payload in JWE format, as well as the secretKey so we can use it
    // for decrypting the payload sent in response
    return {
        secretKey,
        jwe: {
            iv: (0, base64url_1.default)(iv),
            ciphertext: (0, base64url_1.default)(encrypted),
            recipients: [
                {
                    encrypted_key: (0, base64url_1.default)(crypto_1.default.publicEncrypt(key, secretKey.export())),
                },
            ],
            tag: (0, base64url_1.default)(cipher.getAuthTag()),
            protected: header,
        },
    };
}
exports.encryptRequest = encryptRequest;
/**
 * Given the returned JWE and the symmetric symmetric key used in the original request,
 * decrypts the repsonse payload, which is assumed to be JSON
 */
async function decryptResponse(jwe, encryptionKey) {
    const result = await (0, jose_1.generalDecrypt)(jwe, encryptionKey);
    const plaintext = Buffer.from(result.plaintext).toString('utf8');
    return JSON.parse(plaintext);
}
exports.decryptResponse = decryptResponse;
