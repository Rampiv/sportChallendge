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
      // 1. Получаем всех пользователей
      const usersSnapshot = await get(ref(database, "users"))
      if (!usersSnapshot.exists()) {
        console.log("No users found in database")
        return []
      }

      const users = usersSnapshot.val()
      const userRankings: UserRanking[] = []

      // 2. Получаем все daily challenges
      const dailyChallengesSnapshot = await get(
        ref(database, "dailyChallenges"),
      )
      const dailyChallengesData = dailyChallengesSnapshot.exists()
        ? dailyChallengesSnapshot.val()
        : {}

      // 3. Получаем все weekly challenges
      const weeklyChallengesSnapshot = await get(
        ref(database, "weeklyChallenges"),
      )
      const weeklyCompletedCount = weeklyChallengesSnapshot.exists()
        ? Object.values(weeklyChallengesSnapshot.val()).filter(
            (challenge: any) => challenge.isCompleted,
          ).length
        : 0

      // 4. Для каждого пользователя считаем выполненные челленджи
      for (const userId in users) {
        const user = users[userId]
        let completedCount = 0

        // Daily challenges пользователя
        if (dailyChallengesData[userId]) {
          completedCount += Object.values(dailyChallengesData[userId]).filter(
            (challenge: any) => challenge.isCompleted,
          ).length
        }

        // Добавляем completed weekly challenges
        completedCount += weeklyCompletedCount

        userRankings.push({
          userId,
          userName: user.displayName || `User ${userId.slice(0, 6)}`,
          completedChallenges: completedCount,
        })
      }

      // 5. Сортируем и добавляем ранги
      const sortedRankings = userRankings
        .sort((a, b) => b.completedChallenges - a.completedChallenges)
        .map((user, index) => ({ ...user, rank: index + 1 }))

      return sortedRankings
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
