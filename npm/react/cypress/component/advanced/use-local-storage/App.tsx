import * as React from 'react'

export default function App () {
  const [cart, setCart] = React.useState<string[]>(() => {
    const storedCart = localStorage.getItem('cart')

    return (storedCart && JSON.parse(storedCart)) || ['kiwi 🥝']
  })

  const addJuice = () => {
    const updatedCart = cart.concat('juice 🧃')

    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  return (
    <div className="cart">
      <ul>
        {cart.map((item, k) => (
          <li className="item" key={k}>
            {item}
          </li>
        ))}
      </ul>
      <button onClick={addJuice}>Add juice</button>
    </div>
  )
}
