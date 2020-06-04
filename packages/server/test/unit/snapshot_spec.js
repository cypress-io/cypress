snapshot = require('snap-shot-it')

# sanity check to make sure backtick escape works with our snapshots
it "saves snapshot with backticks", ->
  text = """
    line 1
    line 2 with `42`
    line 3 with `foo`
  """
  snapshot("has backticks", text)
