if "%Platform%" == "x32" (
  Set "TARGET_ARCH=ia32"
)

if "%Platform%" == "x64" (
  Set "TARGET_ARCH=x64"
)

echo Target arch set to "%TARGET_ARCH%" from platform "%Platform%"
