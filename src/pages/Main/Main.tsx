import React, { useEffect, useState } from "react"

import {
  addDailyChallenge,
  deleteDailyChallenge,
  incrementChallengeProgress,
  subscribeToChallenges,
  unsubscribeAll,
} from "../../features/challengesSlice/challengesSlice"
import { RootState } from "../../app/store"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { selectCurrentUser } from "../../features/authSlice/authSlice"
import { Challenge } from "../../utils/types"
import {
  ChallengeModal,
  ConfirmModal,
  Loading,
  Navigation,
} from "../../components"
import "./Main.scss"
import { database } from "../../firebase/config"
import { get, ref, update } from "firebase/database"

const NavigationMemo = React.memo(Navigation)

export const Main: React.FC = () => {
  const dispatch = useAppDispatch()
  const { weeklyChallenges, dailyChallenges, error } = useAppSelector(
    (state: RootState) => state.challenges,
  )
  const user = useAppSelector(selectCurrentUser)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(
    null,
  )

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        await dispatch(subscribeToChallenges(user?.uid || "")).unwrap()
        // Проверяем и сбрасываем ежедневные челленджи
        if (user?.uid) {
          await checkAndResetDailyChallenges()
        }
      } catch (err) {
        console.error("Error loading challenges:", err)
      } finally {
        setLoading(false)
      }
    }

    // Ежедневный сброс ежедневок
    const checkAndResetDailyChallenges = async () => {
      const today = new Date().toDateString()
      const dailyRef = ref(database, `dailyChallenges/${user?.uid}`)
      const snapshot = await get(dailyRef)
      const dailyChallenges = snapshot.val()

      if (!dailyChallenges) return

      const updates: Record<string, any> = {}
      let needsUpdate = false

      Object.keys(dailyChallenges).forEach(key => {
        const challenge = dailyChallenges[key]

        if (challenge.lastResetDate !== today) {
          // Правильный формат путей для update
          updates[`${key}/current`] = 0
          updates[`${key}/isCompleted`] = false
          updates[`${key}/lastResetDate`] = today
          needsUpdate = true
        }
      })

      if (needsUpdate) {
        await update(dailyRef, {
          ...updates,
        })
      }
    }

    // Устанавливаем таймер для проверки в полночь
    const setupMidnightReset = () => {
      const now = new Date()
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
      )
      const timeUntilMidnight = midnight.getTime() - now.getTime()

      const timer = setTimeout(async () => {
        if (user?.uid) {
          await checkAndResetDailyChallenges()
        }
        // Устанавливаем периодическую проверку
        setInterval(
          () => {
            if (user?.uid) checkAndResetDailyChallenges()
          },
          24 * 60 * 60 * 1000,
        )
      }, timeUntilMidnight)

      return timer
    }

    const midnightTimer = setupMidnightReset()

    init()

    return () => {
      unsubscribeAll()
      clearTimeout(midnightTimer)
    }
  }, [dispatch, user?.uid])

  const handleAddChallenge = (title: string, target: number) => {
    if (user?.uid) {
      const today = new Date().toDateString()
      dispatch(
        addDailyChallenge({
          challenge: {
            title,
            target,
            current: 0,
            isCompleted: false,
            type: "daily",
            createdAt: Date.now(),
            lastResetDate: today,
            countCompleted: 0,
          },
          userId: user.uid,
        }),
      ).unwrap()
      setIsModalVisible(false)
    }
  }

  const handleIncrementProgress = (id: string, isDaily: boolean) => {
    if (user?.uid) {
      dispatch(
        incrementChallengeProgress({
          id,
          userId: user.uid,
          isDaily,
        }),
      )
    }
  }

  const renderChallengeItem = (item: Challenge) => (
    <>
      <span className="challenges__item-title">{item.title}</span>
      <span className="challenges__item-count">
        {item.current} / {item.target}
      </span>
      {item.type === "daily" && (
        <div className="challenges__item-actions">
          <button
            className={`challenges__item-btn challenges__item-btn_completed ${item.isCompleted ? "completed" : ""}`}
            onClick={() => handleIncrementProgress(item.id, true)}
            disabled={item.isCompleted}
          >
            {item.isCompleted ? "Готово" : "Выполнить"}
          </button>
          <button
            className="challenges__item-btn challenges__item-btn_delete"
            onClick={() => handleDeleteClick(item.id)}
          >
            Удалить
          </button>
        </div>
      )}
    </>
  )

  const handleDeleteClick = (id: string) => {
    setChallengeToDelete(id)
    setConfirmModalVisible(true)
  }

  const handleConfirmDelete = () => {
    if (user?.uid && challengeToDelete) {
      dispatch(
        deleteDailyChallenge({ id: challengeToDelete, userId: user.uid }),
      )
    }
    setConfirmModalVisible(false)
    setChallengeToDelete(null)
  }

  const handleCancelDelete = () => {
    setConfirmModalVisible(false)
    setChallengeToDelete(null)
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>
  }

  if (loading || weeklyChallenges.length === 0) {
    return <Loading />
  }

  return (
    <>
      <section className="challenges">
        <div className="container">
          <div className="challenges__content">
            <h2 className="challenges__h2">Еженедельные испытания</h2>
            <ul className="challenges__list challenges__list_weekly">
              {weeklyChallenges.length > 0 ? (
                weeklyChallenges.map(item => (
                  <li key={item.id} className="challenges__item">
                    {renderChallengeItem(item)}
                  </li>
                ))
              ) : (
                <span className="challenges__void">
                  Нет доступных еженедельных испытаний или они еще не
                  загрузились
                </span>
              )}
            </ul>

            {user && (
              <>
                <h2 className="challenges__h2">Твои дневные испытаения</h2>
                <button
                  className="challenges__btn-add"
                  onClick={() => setIsModalVisible(true)}
                >
                  Добавить ежедневое испытание
                </button>
                <ul className="challenges__list">
                  {dailyChallenges.length > 0 ? (
                    dailyChallenges.map(item => (
                      <li key={item.id} className="challenges__item">
                        {renderChallengeItem(item)}
                      </li>
                    ))
                  ) : (
                    <span className="challenges__void">
                      Ежедневные испытания еще не добавлены или они еще не
                      загрузились
                    </span>
                  )}
                </ul>
              </>
            )}
          </div>

          <ChallengeModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onAdd={handleAddChallenge}
          />
          <ConfirmModal
            visible={confirmModalVisible}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            title="Подтверждение удаления"
            message="Вы уверены, что хотите удалить этот челлендж?"
          />
        </div>
      </section>
      <NavigationMemo
        props={[
          { text: "Рейтинг", href: "/rating" },
          { text: "Аккаунт", href: "#" },
          { text: "Инструкции", href: "#" },
        ]}
      />
    </>
  )
}
