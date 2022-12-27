import React from 'react'

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

const LoginForm: React.FC<LoginFormProps> = (props) => {
  return (
    <div />
  )
}

export default LoginForm
