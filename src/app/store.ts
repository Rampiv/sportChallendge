import { configureStore } from "@reduxjs/toolkit"
import challengesReducer from "../features/challengesSlice/challengesSlice"
import authReducer from '../features/authSlice/authSlice'

const store = configureStore({
  reducer: {
    challenges: challengesReducer,
    auth: authReducer,
  },
})

export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
