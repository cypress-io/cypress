import { useEffect } from 'react'
import _ from 'lodash'

class ThemeProvider {
  _subscribers = [];
  _theme = localStorage.getItem('theme') || 'light';

  subscribe = (callback) => {
    try {
      callback(this._theme)
    } catch (err) {
      console.error('Subscriber could not initial theme value, not subscribing.', err) // eslint-disable-line no-console

      return
    }

    this._subscribers.push(callback)

    return () => {
      this._subscribers = _.without(this._subscribers, callback)
    }
  }

  notifySubs = () => {
    this._subscribers.forEach((sub) => {
      try {
        sub(this._theme)
      } catch (err) {
        console.warn('Subscriber threw error on new theme value.', err) // eslint-disable-line no-console
      }
    })
  }

  toggleTheme = () => {
    const savedTheme = localStorage.getItem('theme')

    const newTheme = savedTheme === 'dark' ? 'light' : 'dark'

    localStorage.setItem('theme', newTheme)
    this._theme = newTheme

    this.notifySubs()
  }
}

const ThemeProviderInstance = new ThemeProvider()

export default ThemeProviderInstance

export const useTheme = () => {
  useEffect(
    () => {
      ThemeProviderInstance.subscribe((theme) => {
        document.body.classList.remove('theme-light')
        document.body.classList.remove('theme-dark')
        document.body.classList
        .add(theme === 'dark' ? 'theme-dark' : 'theme-light')
      })
    },
    []
  )
}
