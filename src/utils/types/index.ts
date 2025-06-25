// Типы для состояния аутентификации
export type AuthState = {
  user: AppUser | null
  isLoading: boolean
  error: string | null
  emailForVerification: string | null
  isEmailVerified: boolean
}

// Типы для данных аутентификации
export type AuthData = {
  email: string
  password: string
  displayName?: string
}

export type AppUser = {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
}

// тип для преобразования юзера из firebase в НОРМАЛЬНЫЙ
export type SerializableUser = {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  photoURL: string | null
  providerId: string
}

export type Challenge = {
  id: string
  title: string
  target: number
  current: number
  isCompleted: boolean
  type: "weekly" | "daily"
  userId?: string // только для daily challenges
  createdAt: number
  lastResetDate?: string
}

export type ChallengesState = {
  weeklyChallenges: Challenge[]
  dailyChallenges: Challenge[]
  loading: boolean
  error: string | null
}
