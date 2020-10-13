import { Search } from '../components/Search'
import HelloWorld from '../components/HelloWorld.mdx'

function IndexPage({ asyncProp }) {
  return (
    <main>
      <h1>Welcome to Next.js</h1>

      {asyncProp && (
        <p data-testid="server-result">
          `.getInitialProps()` was called and passed props to this component
        </p>
      )}

      <Search />
      <HelloWorld />
    </main>
  )
}

IndexPage.getInitialProps = async ctx => {
  return { asyncProp: true }
}

export default IndexPage
