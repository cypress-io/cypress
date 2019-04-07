if "%Platform%" == "x32" (
  Set "TARGET_ARCH=ia32"
  Set "NODE_PLATFORM=x86"
)

if "%Platform%" == "x64" (
  Set "TARGET_ARCH=x64"
  Set "NODE_PLATFORM=x64"
)

echo Target arch set to "%TARGET_ARCH%" and Node platform to "%NODE_PLATFORM%" from platform "%Platform%"
