import React from 'react'
import { getProducts } from '../products'

class AProduct extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      myName: props.name,
      orderCount: 0,
    }
  }

  order() {
    this.setState({
      orderCount: this.state.orderCount + 1,
    })
  }

  render() {
    return (
      <div className="product">
        <span className="name">{this.state.myName}</span>
        <span className="ordered">{this.state.orderCount}</span>
        <button className="order" onClick={this.order.bind(this)}>
          Order
        </button>
      </div>
    )
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
