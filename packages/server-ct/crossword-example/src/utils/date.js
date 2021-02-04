export const oneDay = 1000 * 60 * 60 * 24

export const formatDate = (d) => d.toISOString().slice(0, 10)

export const addTime = (d, amount) => new Date(new Date(d).getTime() + amount)

export const isSunday = (d) => new Date(d).getDay() === 0

export const randomInt = (max) => Math.floor(Math.random() * Math.floor(max))

export const randomSunday = () => {
  // const randomYear = Math.random(0, )
}

// return
