import React from 'react'
import { fetchIngredients as defaultFetchIngredients } from './services'

export default function RemotePizza() {
  const [ingredients, setIngredients] = React.useState([])

  const handleCook = () => {
    defaultFetchIngredients().then(response => {
      setIngredients(response.args.ingredients)
    })
  }

  return (
    <>
      <h3>Pizza</h3>
      <button onClick={handleCook}>Cook</button>
      {ingredients.length > 0 && (
        <ul>
          {ingredients.map(ingredient => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      )}
    </>
  )
}
