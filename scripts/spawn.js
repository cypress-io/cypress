cp = require("child_process")

cmd = process.argv[2]

console.log(process.argv)

// loop through all the packages/@cypress

// for each directory, set cwd
// cp.spawn(cmd, {stdout: "inherit", cwd: dir})