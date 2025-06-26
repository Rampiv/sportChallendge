import { createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { ref, onValue, set, push, remove, get } from "firebase/database"
import { Challenge, ChallengesState } from "../../utils/types"
import { database } from "../../firebase/config"
import { createAppSlice } from "../../app/createAppSlice"
import { AppDispatch } from "../../app/store"

const initialState: ChallengesState = {
  weeklyChallenges: [],
  dailyChallenges: [],
  loading: false,
  error: null,
}

// Асинхронные thunks для работы с Firebase
export const fetchWeeklyChallenges = createAsyncThunk(
  "challenges/fetchWeekly",
  async _ => {
    const challengesRef = ref(database, "weeklyChallenges")
    return new Promise<Challenge[]>(resolve => {
      onValue(challengesRef, snapshot => {
        const data = snapshot.val()
        const challenges = data
          ? Object.keys(data).map(key => ({
              ...data[key],
              id: key,
            }))
          : []
        resolve(challenges)
      })
    })
  },
)

export const fetchDailyChallenges = createAsyncThunk(
  "challenges/fetchDaily",
  async (userId: string) => {
    if (!userId) return []

    const challengesRef = ref(database, `dailyChallenges/${userId}`)
    const snapshot = await get(challengesRef)

    if (!snapshot.exists()) return []

    const data = snapshot.val()
    return Object.keys(data).map(key => ({
      ...data[key],
      id: key,
      userId,
    }))
  },
)

export const addDailyChallenge = createAsyncThunk(
  "challenges/addDaily",
  async ({
    challenge,
    userId,
  }: {
    challenge: Omit<Challenge, "id">
    userId: string
  }) => {
    if (!userId) {
      throw new Error("User ID is required")
    }

    // Ссылка на challenges конкретного пользователя
    const userChallengesRef = ref(database, `dailyChallenges/${userId}`)
    const newChallengeRef = push(userChallengesRef)

    const newChallenge = {
      ...challenge,
      createdAt: Date.now(),
      current: 0,
      isCompleted: false,
      userId, // Добавляем ID пользователя в задание
    }

    await set(newChallengeRef, newChallenge)

    return {
      id: newChallengeRef.key,
      ...newChallenge,
    }
  },
)

export const deleteDailyChallenge = createAsyncThunk(
  "challenges/deleteDaily",
  async ({ id, userId }: { id: string; userId: string }) => {
    const challengeRef = ref(database, `dailyChallenges/${userId}/${id}`)
    await remove(challengeRef)
    return id
  },
)

export const incrementChallengeProgress = createAsyncThunk(
  "challenges/incrementProgress",
  async ({
    id,
    userId,
    isDaily,
  }: {
    id: string
    userId: string
    isDaily: boolean
  }) => {
    const path = isDaily
      ? `dailyChallenges/${userId}/${id}`
      : `weeklyChallenges/${id}`
    const challengeRef = ref(database, path)

    // Получаем текущее состояние
    onValue(
      challengeRef,
      async snapshot => {
        const challenge = snapshot.val()
        if (challenge) {
          const updatedCurrent = challenge.current + 1
          const updatedIsCompleted = updatedCurrent >= challenge.target
          const updatedCountCompleted = updatedIsCompleted
            ? challenge.countCompleted + 1
            : challenge.countCompleted

          // Обновляем challenge
          await set(challengeRef, {
            ...challenge,
            current: updatedCurrent,
            isCompleted: updatedIsCompleted,
            countCompleted: updatedCountCompleted,
          })

          // Если это daily challenge и он выполнен, увеличиваем ВСЕ weekly challenges
          if (isDaily && updatedIsCompleted) {
            // Получаем текущие weekly challenges
            const weeklyChallengesRef = ref(database, "weeklyChallenges")
            const weeklySnapshot = await get(weeklyChallengesRef)
            const weeklyChallenges = weeklySnapshot.val()

            if (weeklyChallenges) {
              // Обновляем каждый weekly challenge
              const updatePromises = Object.keys(weeklyChallenges).map(
                async weeklyId => {
                  const weeklyRef = ref(
                    database,
                    `weeklyChallenges/${weeklyId}`,
                  )
                  const weeklyChallenge = weeklyChallenges[weeklyId]
                  const newCurrent = weeklyChallenge.current + 1

                  await set(weeklyRef, {
                    ...weeklyChallenge,
                    current: newCurrent,
                    isCompleted: newCurrent >= weeklyChallenge.target,
                  })
                },
              )

              await Promise.all(updatePromises)
            }
          }
        }
      },
      { onlyOnce: true },
    )

    return { id, userId, isDaily }
  },
)

// Функция для отписки от всех слушателей
let unsubscribeCallbacks: Array<() => void> = []

export const unsubscribeAll = () => {
  unsubscribeCallbacks.forEach(unsubscribe => unsubscribe())
  unsubscribeCallbacks = []
}

// Подписка на изменения challenges
export const subscribeToChallenges = createAsyncThunk<
  void, // Возвращаемый тип
  string, // Тип аргумента (userId)
  { dispatch: AppDispatch }
>("challenges/subscribe", async (userId, { dispatch }) => {
  unsubscribeAll()

  // Подписка на weekly challenges
  const weeklyRef = ref(database, "weeklyChallenges")
  const weeklyUnsubscribe = onValue(weeklyRef, snapshot => {
    const data = snapshot.val()
    const challenges = data
      ? Object.keys(data).map(key => ({
          ...data[key],
          id: key,
        }))
      : []
    dispatch(setWeeklyChallenges(challenges))
  })
  unsubscribeCallbacks.push(() => weeklyUnsubscribe())

  // Подписка на daily challenges
  if (userId) {
    const dailyRef = ref(database, `dailyChallenges/${userId}`)
    const dailyUnsubscribe = onValue(dailyRef, snapshot => {
      const data = snapshot.val()
      const challenges = data
        ? Object.keys(data).map(key => ({
            ...data[key],
            id: key,
            userId,
          }))
        : []
      dispatch(setDailyChallenges(challenges))
    })
    unsubscribeCallbacks.push(() => dailyUnsubscribe())
  }
})

const challengesSlice = createAppSlice({
  name: "challenges",
  initialState,
  reducers: {
    setWeeklyChallenges: (state, action: PayloadAction<Challenge[]>) => {
      state.weeklyChallenges = action.payload
    },
    setDailyChallenges: (state, action: PayloadAction<Challenge[]>) => {
      state.dailyChallenges = action.payload
    },
    resetChallenges: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWeeklyChallenges.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchWeeklyChallenges.fulfilled,
        (state, action: PayloadAction<Challenge[]>) => {
          state.weeklyChallenges = action.payload
          state.loading = false
        },
      )
      .addCase(fetchWeeklyChallenges.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchDailyChallenges.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchDailyChallenges.fulfilled,
        (state, action: PayloadAction<Challenge[]>) => {
          state.dailyChallenges = action.payload
          state.loading = false
        },
      )
      .addCase(fetchDailyChallenges.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(
        deleteDailyChallenge.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.dailyChallenges = state.dailyChallenges.filter(
            ch => ch.id !== action.payload,
          )
        },
      )
  },
})

export const { setWeeklyChallenges, setDailyChallenges, resetChallenges } =
  challengesSlice.actions
export default challengesSlice.reducer
