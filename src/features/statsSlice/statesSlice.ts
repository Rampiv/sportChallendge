import { createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { database } from "../../firebase/config"
import { ref, get, update } from "firebase/database"
import { RootState } from "../../app/store"
import { createAppSlice } from "../../app/createAppSlice"
import { StatsState, UserRanking, UserStreak } from "../../utils/types"

const initialState: StatsState = {
  activeUsersCount: 0,
  userRankings: [],
  rankingsLoading: false,
  rankingsError: null,
  loading: false,
  error: null,
  streak: {
    current: 0,
    best: 0,
    lastCompleted: null,
    loading: false,
    streakError: null,
  },
  userStreaks: [],
  streaksLoading: false,
  streaksError: null,
}

export const fetchActiveUsersCount = createAsyncThunk(
  "stats/fetchActiveUsersCount",
  async () => {
    const today = new Date().toDateString()
    const snapshot = await get(ref(database, `userActivities/${today}`))
    return snapshot.exists() ? Object.keys(snapshot.val()).length : 0
  },
)

export const fetchUserRankings = createAsyncThunk(
  "stats/fetchUserRankings",
  async (_, { rejectWithValue }) => {
    try {
      // 1. Получаем данные пользователей
      const usersSnapshot = await get(ref(database, "users"))
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {}

      // 2. Создаем массив для рейтинга
      const rankings: UserRanking[] = []

      // 3. Обрабатываем каждого пользователя
      for (const userId in users) {
        const user = users[userId]
        
        // Получаем количество выполненных задач
        // Если completedTasks undefined, считаем 0
        const completedChallenges =
          typeof user.completedTasks === "number" ? user.completedTasks : 0

        const userName = user?.displayName || `User ${userId.slice(0, 6)}`

        rankings.push({
          userId,
          userName,
          completedChallenges,
          rank: 0, // Временное значение
        })
      }

      // 4. Сортируем по количеству выполненных заданий
      rankings.sort((a, b) => b.completedChallenges - a.completedChallenges)

      // 5. Добавляем правильные ранги
      return rankings.map((user, index) => ({
        ...user,
        rank: index + 1,
      }))
    } catch (error) {
      console.error("Error fetching rankings:", error)
      return rejectWithValue("Failed to fetch user rankings")
    }
  },
)

export const fetchUserStreak = createAsyncThunk(
  "stats/fetchUserStreak",
  async (userId: string, { rejectWithValue }) => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const userRef = ref(database, `users/${userId}/streak`)
      const snapshot = await get(userRef)

      if (!snapshot.exists()) {
        return {
          current: 0,
          best: 0,
          lastCompleted: null,
        }
      }

      const streakData = snapshot.val()

      // Если current > best, обновляем best
      const updatedBest = Math.max(streakData.current, streakData.best || 0)

      // Если best изменился, сохраняем в Firebase
      if (updatedBest !== streakData.best) {
        await update(userRef, { best: updatedBest })
      }

      return {
        current: streakData.current || 0,
        best: updatedBest,
        lastCompleted: streakData.lastCompleted || null,
      }
    } catch (error) {
      console.error("Error fetching user streak:", error)
      return rejectWithValue("Failed to fetch user streak")
    }
  },
)

export const fetchUserStreaks = createAsyncThunk(
  "stats/fetchUserStreaks",
  async (_, { rejectWithValue }) => {
    try {
      // 1. Получаем данные пользователей
      const usersSnapshot = await get(ref(database, "users"))
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {}

      // 2. Создаем массив для стриков
      const streaks: UserStreak[] = []

      // 3. Обрабатываем каждого пользователя
      for (const userId in users) {
        const user = users[userId]
        const streakData = user.streak || {
          current: 0,
          best: 0,
          lastCompleted: null,
        }

        streaks.push({
          userId,
          userName: user.displayName || `User ${userId.slice(0, 6)}`,
          current: streakData.current || 0,
          best: streakData.best || 0,
          lastCompleted: streakData.lastCompleted || null,
        })
      }

      return streaks
    } catch (error) {
      console.error("Error fetching streaks:", error)
      return rejectWithValue("Failed to fetch user streaks")
    }
  },
)

const statsSlice = createAppSlice({
  name: "stats",
  initialState,
  reducers: {
    updateStreak: (
      state,
      action: PayloadAction<{ current: number; best?: number }>,
    ) => {
      state.streak.current = action.payload.current
      if (action.payload.best !== undefined) {
        state.streak.best = action.payload.best
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActiveUsersCount.pending, state => {
        state.loading = true
      })
      .addCase(fetchActiveUsersCount.fulfilled, (state, action) => {
        state.activeUsersCount = action.payload
        state.loading = false
      })
      .addCase(fetchActiveUsersCount.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch active users"
        state.loading = false
      })
      .addCase(fetchUserRankings.pending, state => {
        state.rankingsLoading = true
        state.rankingsError = null
      })
      .addCase(fetchUserRankings.fulfilled, (state, action) => {
        state.userRankings = action.payload
        state.rankingsLoading = false
      })
      .addCase(fetchUserRankings.rejected, (state, action) => {
        state.rankingsError =
          action.error.message || "Failed to fetch user rankings"
        state.rankingsLoading = false
      })
      .addCase(fetchUserStreak.pending, state => {
        state.streak.loading = true
        state.streak.streakError = null
      })
      .addCase(fetchUserStreak.fulfilled, (state, action) => {
        state.streak = {
          ...action.payload,
          loading: false,
          streakError: null,
        }
      })
      .addCase(fetchUserStreak.rejected, (state, action) => {
        state.streak.loading = false
        state.streak.streakError =
          action.error.message || "Failed to fetch user streak"
      })
      .addCase(fetchUserStreaks.pending, state => {
        state.streaksLoading = true
        state.streaksError = null
      })
      .addCase(fetchUserStreaks.fulfilled, (state, action) => {
        state.userStreaks = action.payload
        state.streaksLoading = false
      })
      .addCase(fetchUserStreaks.rejected, (state, action) => {
        state.streaksError = action.payload as string
        state.streaksLoading = false
      })
  },
})

export const selectActiveUsersCount = (state: RootState) =>
  state.stats.activeUsersCount

export const selectUserRankings = (state: RootState) => state.stats.userRankings

export const selectRankingsLoading = (state: RootState) =>
  state.stats.rankingsLoading

export const selectRankingsError = (state: RootState) =>
  state.stats.rankingsError
export const selectUserStreak = (state: RootState) => state.stats.streak
export const selectStreakLoading = (state: RootState) =>
  state.stats.streak.loading
export const selectStreakError = (state: RootState) =>
  state.stats.streak.streakError
export const selectUserStreaks = (state: RootState) => state.stats.userStreaks
export const selectStreaksLoading = (state: RootState) =>
  state.stats.streaksLoading

export const { updateStreak } = statsSlice.actions

export default statsSlice.reducer
