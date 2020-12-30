const app = require('express')()
const parser = require('cookie-parser')

app.use(parser())

app.get('/login', (req, res) => {
  res.send(`<html><input type="text"/><input type="password"/><button
  
  >log in</button><script>document.querySelector('button').addEventListener('click', ()=>{
    setTimeout(()=>window.location.href = "/authenticated", 3000)

  })</script></html>`)
})

app.get('/authenticated', (req, res) => {
  res.cookie('userId', '45236356347676657')
  res.send('<html><h1>success</h1><script>localStorage.token = "12345"</script></html>')
})

app.get('/home', (req, res) => {
  if (req.cookies) {
    res.send('<html><h1>welcome</h1></html>')
  }

  res.send('<html><h1>please log in</h1></html>')
})

app.listen(3000)
