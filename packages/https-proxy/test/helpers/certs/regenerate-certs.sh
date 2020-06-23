#!/bin/sh

set -e

# this script will take the CA cert from @packages/https-proxy/ca
# and regenerate all the certs in this directory from it

# folders:
#   ca contains a mock CA
#   client contains public info that a client would have
#   server contains private info that a server would have

CA_PATH=../../../ca

rm -rf $CA_PATH

# ensure regular root CA exists
node -e "require('@packages/https-proxy/lib/ca').create('$CA_PATH')"

echo "remove and relink test CA pems"
for f in ca client server
do
  rm -f $f/my-root-ca.crt.pem
  cp $CA_PATH/certs/ca.pem $f/my-root-ca.crt.pem
done

echo "remove and relink test CA key"
rm -f ca/my-root-ca.key.pem
cp $CA_PATH/keys/ca.private.key ca/my-root-ca.key.pem

echo "reuse existing key and crt to generate a new server csr"
openssl x509 -in server/my-server.crt.pem -signkey server/my-server.key.pem -x509toreq -out server/my-server.csr
rm -f server/my-server.crt.pem ca/*.srl

echo "now use that CSR with the CA to sign a new certificate"
openssl x509 -req -in server/my-server.csr -CA ca/my-root-ca.crt.pem -CAkey ca/my-root-ca.key.pem -CAcreateserial -out server/my-server.crt.pem

echo "get rid of CSR, we don't need it"
rm -f server/my-server.csr

echo "regenerate public key"
rm -f client/my-server.pub
openssl rsa -in server/my-server.key.pem -pubout -out client/my-server.pub
