import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useAppSelector } from "../../app/hooks"
import type { RootState } from "../../app/store"

export const useAuth = (shouldBeAuthenticated: boolean) => {
  const { user } = useAppSelector((state: RootState) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (shouldBeAuthenticated && !user) {
      void navigate("/login")
    } else if (!shouldBeAuthenticated && user) {
      void navigate("/")
    }
  }, [user, shouldBeAuthenticated, navigate])
}
