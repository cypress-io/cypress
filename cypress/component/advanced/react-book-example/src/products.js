export const getProducts = () => {
  console.log('fetch products')
  return fetch('http://myapi.com/products')
    .then(r => r.json())
    .then(json => {
      console.log('products', json.products)
      return json.products
    })
}
