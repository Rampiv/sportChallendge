import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { useNavigate } from "react-router"
import { login, register, setUser } from "../../features/authSlice/authSlice"
import { SerializableUser } from "../../utils/types"
import "./AuthPage.scss"
import { EyeVisible, InfiniteSpinner } from "../../assets/svg"
import React from "react"

const EyeVisibleMemo = React.memo(EyeVisible)

export const AuthPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(state => state.auth.user)

  // Проверяем сохраненную сессию при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem("RampivSportChallendge")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as SerializableUser
      dispatch(setUser(parsedUser))
    }
  }, [])

  // Перенаправляем если пользователь авторизован
  useEffect(() => {
    if (user) {
      navigate("/")
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // валидация
    const validateForm = () => {
      if (!email.includes("@")) {
        setError("Введите корректный email")
        return false
      }
      if (password.length < 6) {
        setError("Пароль должен содержать минимум 6 символов")
        return false
      }
      return true
    }
    if (!validateForm()) return
    setLoading(true)
    setError("")

    try {
      let result
      if (isLogin) {
        result = await dispatch(login({ email, password })).unwrap()
      } else {
        result = await dispatch(register({ email, password })).unwrap()
      }

      // Сохраняем пользователя в localStorage
      localStorage.setItem("RampivSportChallendge", JSON.stringify(result))

      navigate("/")
    } catch (error) {
      // Ошибки уже обработаны в thunks, но можно добавить доп. логику
      console.error("Auth error:", error)
      setError('Произошла ошибка. Перезагрузите страницу')
    } finally {
      setLoading(false)
    }
  }

  // Функция показать/скрыть пароль
  const handleShowPassword = () => {
    setPasswordVisible(!passwordVisible)
  }

  return (
    <div className="auth">
      <div className="container">
        <div className="auth__content">
          <h2 className="auth__h2">
            {isLogin ? "Вход в аккаунт" : "Регистрация"}
          </h2>

          {error && (
            <div className="error">
              <span className="error__text">{error}</span>
            </div>
          )}

          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="auth__credential">
              <label htmlFor="email" className="auth__credential-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                }}
                className="auth__credential-input"
                placeholder="Email"
              />
              <div className="auth__credential">
                <label htmlFor="password" className="auth__credential-label">
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                  }}
                  className="auth__credential-input"
                  placeholder="Пароль"
                />
                <a
                  href="#"
                  className="password-control"
                  onClick={handleShowPassword}
                >
                  <EyeVisibleMemo />
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth__credential-button"
            >
              {loading ? (
                <InfiniteSpinner className={"auth__loading"} />
              ) : isLogin ? (
                "Войти"
              ) : (
                "Зарегистрироваться"
              )}
            </button>
          </form>

          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
            }}
            className="auth__toggle"
          >
            {isLogin
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  )
}
