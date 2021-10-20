module.exports = async function () {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  throw new Error('Error Loading Plugin!!!')
}
