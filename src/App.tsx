import "./App.scss"
import { Route, Routes } from "react-router"
import { AuthPage, Main, RatingPage } from "./pages"
import { ProtectedRoute } from "./components"

export const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Main />} />
          <Route path="/rating" element={<RatingPage />} />
        </Route>
      </Routes>
    </div>
  )
}
