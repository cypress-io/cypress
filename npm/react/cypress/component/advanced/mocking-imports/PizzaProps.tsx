import React from 'react'
import { fetchIngredients as defaultFetchIngredients } from './services'
import type { IngredientsResponse } from './services'

interface PizzaPropsProps {
  fetchIngredients?: () => Promise<IngredientsResponse>
}

// React 19 drops defaultProps on function components, so the defaults live
// in an object the default parameter reads on every render, where tests can stub them
export const defaultProps = {
  fetchIngredients: defaultFetchIngredients,
}

export default function PizzaProps ({ fetchIngredients = defaultProps.fetchIngredients }: PizzaPropsProps) {
  const [ingredients, setIngredients] = React.useState<string[]>([])

  const handleCook = () => {
    fetchIngredients().then((response) => {
      setIngredients(response.args.ingredients)
    })
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
