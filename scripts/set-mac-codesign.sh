set -e

if [[ "$OSTYPE" == "darwin"* ]]; then

  echo "This shell scripts imports Mac code sign profile from environment variable"
  echo "Assumes the certificate is base64 encoded as environment variable Certificates"
  echo "and its password is in environment variable P12_PASSWORD"
  echo "should be run with sudo"
  echo ""

  if [ -z "$Certificates" ]; then
    echo "Need to provide environment variable Certificates"
    exit 1
  fi
  if [ -z "$P12_PASSWORD" ]; then
    echo "Need to provide environment variable P12_PASSWORD"
    exit 1
  fi

  echo $Certificates | base64 -D -o Certificates.p12
  sudo -E security import ./Certificates.p12 -P $P12_PASSWORD

  # check
  security list-keychains
  security find-identity -v -p codesigning
else
  echo "Not Mac platform, skipping code sign setup"
fi
