import { Navigate, Outlet } from "react-router"
import type { RootState } from "../../app/store"
import { useAppSelector } from "../../app/hooks"

export const ProtectedRoute = () => {
  const { user } = useAppSelector((state: RootState) => state.auth)
  return user ? <Outlet /> : <Navigate to="/login" replace />
}