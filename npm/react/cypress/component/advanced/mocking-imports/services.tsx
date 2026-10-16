export interface IngredientsResponse {
  args: {
    ingredients: string[]
  }
}

export const fetchIngredients = (): Promise<IngredientsResponse> => {
  return fetch('/api/pizza-ingredients').then((r) => r.json())
}
