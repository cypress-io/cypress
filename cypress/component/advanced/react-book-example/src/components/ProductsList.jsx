import React from 'react'
import { getProducts } from '../products'

const Products = ({ products }) => (
  <React.Fragment>
    {products.map(product => (
      <div>{product.name}</div>
    ))}
  </React.Fragment>
)

class ProductsContainer extends React.Component {
  state = {
    products: [],
  }

  componentDidMount() {
    console.log('fetching products')
    // for now use promises
    return getProducts().then(products => {
      this.setState({
        products,
      })
    })
  }

  render() {
    return <Products products={this.state.products} />
  }
}

export default ProductsContainer
