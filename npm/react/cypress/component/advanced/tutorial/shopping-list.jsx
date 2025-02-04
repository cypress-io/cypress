import React from 'react'

export default function ShoppingList ({ name }) {
  return (
    <div className="shopping-list">
      <h1>Shopping List for {name}</h1>
      <ul>
        <li>Instagram</li>
        <li>WhatsApp</li>
        <li>Oculus</li>
      </ul>
    </div>
  )
}
