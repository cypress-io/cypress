export const getProducts = () => {
  console.log('fetch products') // eslint-disable-line no-console

  return fetch('http://myapi.com/products')
  .then((r) => r.json())
  .then((json) => {
    console.log('products', json.products) // eslint-disable-line no-console

    return json.products
  })
}
