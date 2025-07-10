import { createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { ref, onValue, set, push, remove, get, update } from "firebase/database"
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

function addUniqueItem(arr: Array<string>, item: string) {
  if (!arr.includes(item)) {
    arr.push(item)
  }
  return arr
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
  "challenges/fetchDailyChallenges",
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

export const editDailyChallenge = createAsyncThunk(
  "challenges/editDaily",
  async ({
    challenge,
    userId,
    challengeId,
  }: {
    challenge: Omit<Challenge, "id">
    userId: string
    challengeId: string
  }) => {
    if (!userId) {
      throw new Error("User ID is required")
    }
    if (!challengeId) {
      throw new Error("Challenge ID is required")
    }

    const challengeRef = ref(
      database,
      `dailyChallenges/${userId}/${challengeId}`,
    )
    const snapshot = await get(challengeRef)

    if (!snapshot.exists()) {
      throw new Error("Challenge not found")
    }

    // Сохраняем прогресс и даты выполнения из существующего челленджа
    const existingChallenge = snapshot.val()
    const updatedChallenge = {
      ...existingChallenge,
      ...challenge,
      // Не перезаписываем эти поля:
      current: existingChallenge.current,
      isCompleted: existingChallenge.isCompleted,
      countCompleted: existingChallenge.countCompleted,
      isCompletedData: existingChallenge.isCompletedData || [],
      lastResetDate: existingChallenge.lastResetDate,
      createdAt: existingChallenge.createdAt,
      userId: existingChallenge.userId,
    }

    await update(challengeRef, updatedChallenge)

    return {
      id: challengeId,
      ...updatedChallenge,
    }
  },
)

// повышаем значение челленджа, если daily выполнен, то и weekly, обновляем количество дней подряд (стрик)
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
            ? +challenge.countCompleted + 1
            : +challenge.countCompleted
          const updatedIsCompletedData = updatedIsCompleted
            ? challenge.isCompletedData
              ? [...challenge.isCompletedData, Date.now()]
              : [Date.now()]
            : challenge.isCompletedData
              ? [...challenge.isCompletedData]
              : []

          // Обновляем challenge
          await set(challengeRef, {
            ...challenge,
            current: updatedCurrent,
            isCompleted: updatedIsCompleted,
            countCompleted: updatedCountCompleted,
            isCompletedData: updatedIsCompletedData,
          })

          // Если это daily challenge и он выполнен, увеличиваем ВСЕ weekly challenges, streak механика
          if (isDaily && updatedIsCompleted) {
            // 1.обновляем weeklyChallenge
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
                  const weeklyIsCompleted = weeklyChallenge.isCompleted
                  const updatedUsers = addUniqueItem(
                    weeklyChallenge.users ? [...weeklyChallenge.users] : [],
                    userId,
                  )

                  if (!weeklyIsCompleted) {
                    await set(weeklyRef, {
                      ...weeklyChallenge,
                      current: newCurrent,
                      isCompleted: newCurrent >= weeklyChallenge.target,
                      users: updatedUsers,
                    })
                  }
                },
              )

              await Promise.all(updatePromises)
            }

            // 2.обновляем стрик
            const userRef = ref(database, `users/${userId}`)
            const userSnapshot = await get(userRef)
            const user = userSnapshot.val()
            const now = Date.now()
            const today = new Date(now).setHours(0, 0, 0, 0)
            const yesterday = today - 86400000 // минус 1 день в миллисекундах

            // Проверяем, когда последний раз обновлялся стрик
            const lastCompleted = user?.streak?.lastCompleted || 0
            const lastCompletedDate = new Date(lastCompleted).setHours(
              0,
              0,
              0,
              0,
            )

            // Если последнее обновление было не сегодня
            if (lastCompletedDate < today) {
              let currentStreak = user?.streak?.current || 0

              // Проверяем, был ли вчера выполнен daily
              if (lastCompleted >= yesterday) {
                currentStreak += 1
              } else {
                currentStreak = 1 // Сбрасываем стрик, если пропустили день
              }

              // Обновляем данные пользователя
              await update(userRef, {
                ...user,
                streak: {
                  current: currentStreak,
                  lastCompleted: now, // Фиксируем время последнего выполнения
                  best: Math.max(currentStreak, user?.streak?.best || 0),
                },
              })
            }

            // 3. Добавляем достижение за стрик
            // if (currentStreak % 7 === 0) {
            //   // Например, каждые 7 дней
            //   const achievementRef = ref(
            //     database,
            //     `users/${userId}/achievements/streak_${currentStreak}`,
            //   )
            //   await set(achievementRef, {
            //     title: `${currentStreak}-дневный стрик!`,
            //     description: `Вы выполняете задания ${currentStreak} дней подряд`,
            //     date: now,
            //     type: "streak",
            //   })
            // }
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
      .addCase(editDailyChallenge.fulfilled, (state, action) => {
        const index = state.dailyChallenges.findIndex(
          c => c.id === action.payload.id,
        )
        if (index !== -1) {
          state.dailyChallenges[index] = action.payload
        }
      })
  },
})

export const { setWeeklyChallenges, setDailyChallenges, resetChallenges } =
  challengesSlice.actions
export default challengesSlice.reducer
