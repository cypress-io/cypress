/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const req = win => new Promise(function(resolve, reject) {
  const rand = Math.random();

  const xhr = new win.XMLHttpRequest();
  xhr.open("GET", "http://localhost:1515/cached/");
  xhr.onload = () => resolve(win);
  xhr.onerror = reject;
  return xhr.send();
});

it("makes cached request", () => cy
  .visit("http://localhost:1515")
  .then(req) //# this creates the disk cache
  .then(req)); //# this should not hit our server
