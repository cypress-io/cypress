import React from 'react'
import { fetchIngredients as defaultFetchIngredients } from './services'

export default function PizzaProps ({ fetchIngredients }) {
  const [ingredients, setIngredients] = React.useState([])

  const handleCook = async () => {
    const { args } = await fetchIngredients()
    setIngredients(args.ingredients)
  }

  return (
    <>
      <h3>Pizza</h3>
      <button onClick={handleCook}>Cook</button>
      {ingredients.length > 0 && (
        <ul>
          {ingredients.map((ingredient) => {
            return (
              <li key={ingredient}>{ingredient}</li>
            )
          })}
        </ul>
      )}
    </>
  )
}

PizzaProps.defaultProps = {
  fetchIngredients: defaultFetchIngredients,
}
