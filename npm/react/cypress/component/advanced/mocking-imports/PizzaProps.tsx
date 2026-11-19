import React from 'react'
import { fetchIngredients as defaultFetchIngredients } from './services'
import type { IngredientsResponse } from './services'

interface PizzaPropsProps {
  fetchIngredients?: () => Promise<IngredientsResponse>
}

// React 19 ignores defaultProps on function components, so tests stub this object instead
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
