import { configureStore } from "@reduxjs/toolkit"
import challengesReducer from "../features/challengesSlice/challengesSlice"
import authReducer from "../features/authSlice/authSlice"
import statsReducer from "../features/statsSlice/statesSlice"

const store = configureStore({
  reducer: {
    challenges: challengesReducer,
    auth: authReducer,
    stats: statsReducer,
  },
})

export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
