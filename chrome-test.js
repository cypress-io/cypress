const http = require("http")


http.createServer((req, res) => {
  console.log("GOT A REQUEST")
  process.exit()
}).listen(2345)
