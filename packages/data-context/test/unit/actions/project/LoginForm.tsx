import React, { useState } from 'react'

interface LoginFormProps {
  onLogin: ({
    username,
    password,
  }: {
    username: string
    password: string
  }) => void
  title?: string
  errorMessage?: string
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, title = 'Log In', errorMessage }) => {
  const [submitted, setSubmitted] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (username && password) {
      onLogin({ username, password })
    }

    setSubmitted(true)
  }

  return (
    <div className="rounded-md mx-auto max-w-screen-sm bg-gray-50 shadow-lg p-12">
      <form className="flex flex-col" onSubmit={handleFormSubmit}>
        <fieldset>
          <legend className="mb-4 text-3xl text-gray-800">{title}</legend>
          <input
            name="username"
            type="text"
            label="Username"
            submitted={submitted}
            requiredMessage="Username is required"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            autoComplete="username"
          />
          <input
            name="password"
            type="password"
            label="Password"
            submitted={submitted}
            requiredMessage="Password is required"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            autoComplete="current-password"
          />
          {errorMessage && (
            <div className="mt-2 text-red-500">{errorMessage}</div>
          )}
        </fieldset>
      </form>
    </div>
  )
}

export default LoginForm
