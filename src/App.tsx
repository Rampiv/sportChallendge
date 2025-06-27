import "./App.scss"
import { Route, Routes } from "react-router"
import { AccountPage, AuthPage, Main, RatingPage } from "./pages"
import { ProtectedRoute } from "./components"
import { useAppDispatch } from "./app/hooks"
import { useEffect } from "react"
import { checkAuthState } from "./features/authSlice/authSlice"

export const App = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Проверяем состояние авторизации при загрузке приложения
    dispatch(checkAuthState())
  }, [dispatch])

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Main />} />
          <Route path="/rating" element={<RatingPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </div>
  )
}
