export const fetchIngredients = async () => {
  const r = await fetch(
    'https://httpbin.org/anything?ingredients=bacon&ingredients=mozzarella&ingredients=pineapples',
  )
  return r.json()
}
