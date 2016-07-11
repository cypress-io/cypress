import {foo} from "./lib"

class Bar {}

class Foo extends Bar {
  render () {
    return "rendering!"
  }
}

export default Foo