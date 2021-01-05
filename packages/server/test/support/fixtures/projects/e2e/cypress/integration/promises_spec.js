it "catches regular promise errors", ->
  Promise.reject(new Error("bar"))

it "catches promise errors and calls done with err even when async", (done) ->
  Promise.resolve(null)
  .then ->
    throw new Error("foo")
