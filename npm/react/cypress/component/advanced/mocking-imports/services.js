export const fetchIngredients = () => {
  return fetch(
    'https://httpbin.org/anything?ingredients=bacon&ingredients=mozzarella&ingredients=pineapples',
  ).then((r) => r.json())
}
