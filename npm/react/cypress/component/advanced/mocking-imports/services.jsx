export const fetchIngredients = () => {
  return fetch('/api/pizza-ingredients').then((r) => r.json())
}
