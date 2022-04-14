export const asyncGreeting = async (greeting: string) => {
  return Promise.resolve(`Hello, ${greeting}!`)
}
