// src/features/auth/authSlice.ts
import { createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  AuthError,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth"
import { createAppSlice } from "../../app/createAppSlice"
import { auth } from "../../firebase/config"
import { AuthData, AuthState, SerializableUser } from "../../utils/types"

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
});

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

      await sendEmailVerification(userCredential.user)
      await signOut(auth)

      return toSerializableUser(userCredential.user) // Возвращаем только нужные данные
    } catch (error) {
      const authError = error as AuthError
      return rejectWithValue(authError.message)
    }
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
