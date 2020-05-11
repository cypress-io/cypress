import React from 'react'
import { getProducts } from '../products'

class AProduct extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: props.name,
    }
  }

  render() {
    return <div className="product">{this.state.name}</div>
  }
}

const Products = ({ products }) => (
  <React.Fragment>
    {products.map(product => (
      <AProduct key={product.id} name={product.name} />
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
    return (
      <div className="product-container">
        <Products products={this.state.products} />
      </div>
    )
  }
}

export default ProductsContainer
