import "./App.scss"
import { Route, Routes } from "react-router"
import { AuthPage, Main } from "./pages"
import { ProtectedRoute } from "./components"

export const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Main />} />
        </Route>
      </Routes>
    </div>
  )
}
