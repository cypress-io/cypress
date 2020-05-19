import React, { useState } from 'react'
import axios from 'axios'

export default function Fetcher({ url }) {
  const [greeting, setGreeting] = useState('')
  const [buttonClicked, setButtonClicked] = useState(false)

  const fetchGreeting = () => {
    axios.get(url).then(response => {
      const data = response.data
      const { greeting } = data
      setGreeting(greeting)
      setButtonClicked(true)
    })
  }

  const buttonText = buttonClicked ? 'Ok' : 'Load Greeting'

  return (
    <div>
      <button onClick={fetchGreeting} disabled={buttonClicked} role="button">
        {buttonText}
      </button>
      {greeting ? <h1 role="heading">{greeting}</h1> : null}
    </div>
  )
}
