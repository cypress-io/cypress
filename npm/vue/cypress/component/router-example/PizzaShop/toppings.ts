const CHEESE = { name: 'cheese', icon: '🧀' }
const TOMATOES = { name: 'tomatoes', icon: '🍅' }
const MUSHROOMS = { name: 'mushrooms', icon: '🍄' }
const PEPPERS = { name: 'peppers', icon: '🌶' }
const PINEAPPLE = { name: 'pineapple', icon: '🍍' }
const CHICKEN = { name: 'chicken', icon: '🐔' }
const STEAK = { name: 'steak', icon: '🐮' }
const HAM = { name: 'ham', icon: '🐷' }
const BACON = { name: 'bacon', icon: '🥓' }

const veggie = [CHEESE, TOMATOES, MUSHROOMS, PEPPERS, PINEAPPLE]
const vegan = [TOMATOES, MUSHROOMS, PEPPERS, PINEAPPLE]
const meatlover = [CHEESE, CHICKEN, STEAK, HAM, BACON]
const hawaiian = [CHEESE, PINEAPPLE, HAM]

export const ALL_TOPPINGS = [
  CHEESE,
  TOMATOES,
  MUSHROOMS,
  PEPPERS,
  PINEAPPLE,
  CHICKEN,
  STEAK,
  HAM,
  BACON,
]

export const PRESETS = { veggie, vegan, meatlover, hawaiian }
