export const caseInsensitiveGet = function (obj, lowercaseProperty) {
  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return obj[key]
    }
  }
}

export const caseInsensitiveHas = function (obj, lowercaseProperty) {
  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return true
    }
  }

  return false
}
