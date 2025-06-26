import { createAsyncThunk } from "@reduxjs/toolkit"
import { database } from "../../firebase/config"
import { ref, get } from "firebase/database"
import { RootState } from "../../app/store"
import { createAppSlice } from "../../app/createAppSlice"
import { StatsState, UserRanking } from "../../utils/types"

const initialState: StatsState = {
  activeUsersCount: 0,
  userRankings: [],
  rankingsLoading: false,
  rankingsError: null,
  loading: false,
  error: null,
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

      // 2. Получаем данные daily challenges
      const dailyChallengesSnapshot = await get(
        ref(database, "dailyChallenges"),
      )
      const dailyChallenges = dailyChallengesSnapshot.exists()
        ? dailyChallengesSnapshot.val()
        : {}

      // 3. Создаем массив для рейтинга
      const rankings: UserRanking[] = []

      // 4. Обрабатываем каждого пользователя из dailyChallenges
      for (const userId in dailyChallenges) {
        const challenges = dailyChallenges[userId]
        let completed = 0

        // Считаем выполненные челленджи
        for (const challengeId in challenges) {
          if (challenges[challengeId].isCompleted) {
            completed++
          }
        }

        // Получаем имя пользователя
        let userName = `User Anonim`

        // Проверяем наличие пользователя в базе
        if (users[userId]) {
          // Проверяем разные варианты имени
          userName = users[userId].displayName
        }

        rankings.push({
          userId,
          userName,
          completedChallenges: completed,
          rank: 0, // Временное значение, будет обновлено после сортировки
        })
      }

      // 5. Сортируем по количеству выполненных заданий
      rankings.sort((a, b) => b.completedChallenges - a.completedChallenges)

      // 6. Добавляем правильные ранги
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

const statsSlice = createAppSlice({
  name: "stats",
  initialState,
  reducers: {},
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
  },
})

export const selectActiveUsersCount = (state: RootState) =>
  state.stats.activeUsersCount

export const selectUserRankings = (state: RootState) => state.stats.userRankings

export const selectRankingsLoading = (state: RootState) =>
  state.stats.rankingsLoading

export const selectRankingsError = (state: RootState) =>
  state.stats.rankingsError

export default statsSlice.reducer
