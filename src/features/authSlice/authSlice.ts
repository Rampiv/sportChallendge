// src/features/auth/authSlice.ts
import { createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  AuthError,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
} from "firebase/auth"
import { createAppSlice } from "../../app/createAppSlice"
import { auth, database } from "../../firebase/config"
import { AuthData, AuthState, SerializableUser } from "../../utils/types"
import { ref, remove, set } from "firebase/database"

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  emailForVerification: null,
  isEmailVerified: false,
}

// Функция преобразования Firebase User в сериализуемый объект
const toSerializableUser = (user: User): SerializableUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  emailVerified: user.emailVerified,
  photoURL: user.photoURL,
  providerId: user.providerId,
})

// Асинхронные Thunks
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: AuthData, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )

      // if (!userCredential.user.emailVerified) {
      //   await signOut(auth)
      //   return rejectWithValue("Подтвердите email перед входом")
      // }

      return toSerializableUser(userCredential.user) // преобразованный юзер объект, чтобы консоль не повесилась
    } catch (error) {
      const authError = error as AuthError
      return rejectWithValue(authError.message)
    }
  },
)

export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password, displayName }: AuthData, { rejectWithValue }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )

      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      // Сохраняем пользователя в базу данных
      await set(ref(database, `users/${userCredential.user.uid}`), {
        displayName: displayName || "",
        email: email,
        createdAt: Date.now(),
      })

      await sendEmailVerification(userCredential.user)
      await signOut(auth)

      return toSerializableUser(userCredential.user)
    } catch (error) {
      const authError = error as AuthError
      return rejectWithValue(authError.message)
    }
  },
)

export const updateUserEmail = createAsyncThunk(
  "auth/updateEmail",
  async ({ newEmail, password }: { newEmail: string; password: string }) => {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    // Реаутентификация перед сменой email
    const credential = EmailAuthProvider.credential(user.email!, password)
    await reauthenticateWithCredential(user, credential)

    await updateEmail(user, newEmail)

    // Обновляем email в базе данных
    await set(ref(database, `users/${user.uid}/email`), newEmail)

    return { email: newEmail }
  },
)

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (displayName: string) => {
    const user = auth.currentUser
    console.log(auth)
    if (!user) throw new Error("User not authenticated")

    await updateProfile(user, { displayName })

    // Обновляем displayName в базе данных
    await set(ref(database, `users/${user.uid}/displayName`), displayName)

    return { displayName }
  },
)

export const updateUserPassword = createAsyncThunk(
  "auth/updatePassword",
  async (
    {
      newPassword,
      currentPassword,
    }: {
      newPassword: string
      currentPassword: string
    },
    { rejectWithValue },
  ) => {
    try {
      const user = auth.currentUser

      if (!user || !user.email) {
        return rejectWithValue("Требуется вход в систему")
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      )
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      return true
    } catch (error: unknown) {
      // Явно указываем тип unknown
      if (error instanceof Error) {
        const firebaseError = error as { code?: string; message: string }

        let errorMessage = "Ошибка при изменении пароля"
        if (firebaseError.code === "auth/wrong-password") {
          errorMessage = "Неверный текущий пароль"
        } else if (firebaseError.code === "auth/requires-recent-login") {
          errorMessage = "Требуется повторный вход. Пожалуйста, войдите снова."
        }

        return rejectWithValue(firebaseError.message || errorMessage)
      }
      return rejectWithValue("Неизвестная ошибка")
    }
  },
)
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    await signOut(auth)
    localStorage.removeItem("RampivSportChallendge")
    dispatch(resetAuthState())
  },
)

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (password: string, { dispatch }) => {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    // Реаутентификация перед удалением
    const credential = EmailAuthProvider.credential(user.email!, password)
    await reauthenticateWithCredential(user, credential)

    // Удаляем из базы данных
    await remove(ref(database, `users/${user.uid}`))

    // Удаляем аккаунт из Firebase Auth
    await deleteUser(user)

    // Очищаем localStorage
    localStorage.removeItem("RampivSportChallendge")

    dispatch(resetAuthState())
    return true
  },
)


const authSlice = createAppSlice({
  name: "auth",
  initialState,
  reducers: {
    // Установка данных пользователя
    setUser: (state, action: PayloadAction<AuthState["user"] | null>) => {
      state.user = action.payload
      state.isEmailVerified = action.payload?.emailVerified ?? false
      state.error = null
    },

    // Установка состояния загрузки
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Установка ошибки
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Сохранение email для верификации
    setEmailForVerification: (state, action: PayloadAction<string | null>) => {
      state.emailForVerification = action.payload
    },

    // Подтверждение email
    verifyEmail: state => {
      if (state.user) {
        state.isEmailVerified = true
      }
    },

    // Сброс состояния
    resetAuthState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Обработка логина
      .addCase(login.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isEmailVerified = action.payload.emailVerified
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Обработка регистрации
      .addCase(register.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.emailForVerification = action.payload.email
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Обработка logoutUser
      .addCase(logoutUser.fulfilled, state => {
        state.user = null
        state.isEmailVerified = false
      })
  },
})

// Экспорт действий
export const {
  setUser,
  setLoading,
  setError,
  setEmailForVerification,
  verifyEmail,
  resetAuthState,
} = authSlice.actions

// Селекторы
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectEmailForVerification = (state: { auth: AuthState }) =>
  state.auth.emailForVerification
export const selectIsEmailVerified = (state: { auth: AuthState }) =>
  state.auth.isEmailVerified

// Редьюсер по умолчанию
export default authSlice.reducer
