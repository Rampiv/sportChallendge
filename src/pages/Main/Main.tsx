import React, { useEffect, useState } from "react"

import {
  addDailyChallenge,
  deleteDailyChallenge,
  editDailyChallenge,
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
import type { CollapseProps } from "antd"
import { Collapse } from "antd"
import {
  fetchActiveUsersCount,
  fetchUserStreak,
  selectActiveUsersCount,
  selectUserStreak,
} from "../../features/statsSlice/statesSlice"
import { updateUserActivity } from "../../utils/services/userActivityService/userActivityService"
import { Link } from "react-router"
import { PencilIcon } from "../../assets/svg"

const NavigationMemo = React.memo(Navigation)
const ChallengeModalMemo = React.memo(ChallengeModal)
const ConfirmModalMemo = React.memo(ConfirmModal)
const LoadingMemo = React.memo(Loading)

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
  const [isEdit, setIsEdit] = useState(false)
  const [challengeId, setChallengeId] = useState("")
  const activeUsersCount = useAppSelector(selectActiveUsersCount)
  const { current, best } = useAppSelector(selectUserStreak)

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        await dispatch(subscribeToChallenges(user?.uid || "")).unwrap()
        // Проверяем и сбрасываем ежедневные челленджи
        if (user?.uid) {
          await updateUserActivity(user.uid)
          await dispatch(fetchActiveUsersCount())
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

    // получаем streak пользователя
    if (user?.uid) {
      dispatch(fetchUserStreak(user?.uid))
    }

    init()

    return () => {
      unsubscribeAll()
      clearTimeout(midnightTimer)
    }
  }, [dispatch, user?.uid])

  const handleAddChallenge = (title: string, target: number, group: string) => {
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
            group,
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

  const handleEditChallenge = async (
    title: string,
    target: number,
    group: string,
  ) => {
    if (user?.uid) {
      await dispatch(
        editDailyChallenge({
          challenge: {
            title: title,
            target: Number(target),
            group: group,
            current: 0,
            isCompleted: false,
            type: "daily",
            createdAt: 0,
            countCompleted: 0,
          },
          userId: user?.uid,
          challengeId: challengeId,
        }),
      ).unwrap()
      setIsModalVisible(false)
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
            className={`challenges__item-btn challenges__item-btn_edit`}
            onClick={() => {
              setIsModalVisible(true)
              setIsEdit(true)
              setChallengeId(item.id)
            }}
          >
            <PencilIcon className="challenges__item-btn_edit-title" />
          </button>
          <button
            className={`challenges__item-btn challenges__item-btn_completed ${item.isCompleted ? "completed" : ""}`}
            onClick={() => handleIncrementProgress(item.id, true)}
            disabled={item.isCompleted}
          >
            ✓
          </button>
          <button
            className="challenges__item-btn challenges__item-btn_delete"
            onClick={() => handleDeleteClick(item.id)}
          >
            Х
          </button>
        </div>
      )}
    </>
  )

  const groupDailyChallenges = (challenges: Challenge[]) => {
    const grouped: Record<string, Challenge[]> = {}
    const ungrouped: Challenge[] = []

    challenges.forEach(challenge => {
      if (challenge.group) {
        if (!grouped[challenge.group]) {
          grouped[challenge.group] = []
        }
        grouped[challenge.group].push(challenge)
      } else {
        ungrouped.push(challenge)
      }
    })

    return { grouped, ungrouped }
  }

  const renderGroupedChallenges = () => {
    const { grouped, ungrouped } = groupDailyChallenges(dailyChallenges)

    const collapseItems: CollapseProps["items"] = Object.entries(grouped).map(
      ([groupName, challenges]) => ({
        key: groupName,
        label: groupName,
        children: (
          <ul className="challenges__list">
            {challenges.map(item => (
              <li key={item.id} className="challenges__item">
                {renderChallengeItem(item)}
              </li>
            ))}
          </ul>
        ),
      }),
    )

    return (
      <>
        {Object.keys(grouped).length > 0 && (
          <Collapse items={collapseItems} className="challenges__collapse" />
        )}
        {ungrouped.length > 0 && (
          <ul className="challenges__list">
            {ungrouped.map(item => (
              <li key={item.id} className="challenges__item">
                {renderChallengeItem(item)}
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

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
    return <LoadingMemo />
  }

  return (
    <>
      <NavigationMemo />
      <section className="challenges">
        <div className="container">
          <div className="challenges__content">
            <h2 className="challenges__h2">Еженедельные испытания</h2>
            <ul className="challenges__list challenges__list_weekly">
              {weeklyChallenges.length > 0 ? (
                weeklyChallenges.map(item =>
                  !item.isCompleted ? (
                    <li key={item.id} className="challenges__item">
                      {renderChallengeItem(item)}
                    </li>
                  ) : (
                    ""
                  ),
                )
              ) : (
                <span className="challenges__void">
                  Нет доступных еженедельных испытаний или они еще не
                  загрузились
                </span>
              )}
            </ul>
            <span className="challenges__active-users">
              Активных пользователей сегодня:{" "}
              <strong>{activeUsersCount}</strong>
            </span>

            <span className="challenges__active-users">
              Твоя текущая{" "}
              <Link to="/faq?question=1" className="faq-link">
                серия
              </Link>{" "}
              выполнения: <strong>{current}</strong>
            </span>

            <span className="challenges__active-users">
              Твоя максимальная серия выполнений: <strong>{best}</strong>
            </span>

            {user && (
              <>
                <h2 className="challenges__h2">Твои дневные испытания</h2>
                <button
                  className="challenges__btn-add"
                  onClick={() => {
                    setIsEdit(false)
                    setIsModalVisible(true)
                  }}
                >
                  Добавить ежедневое испытание
                </button>
                {renderGroupedChallenges()}
              </>
            )}
          </div>

          <ChallengeModalMemo
            visible={isModalVisible}
            onClose={() => {
              setIsModalVisible(false)
              setIsEdit(false)
            }}
            onAdd={handleAddChallenge}
            edit={isEdit}
            userId={user?.uid}
            challengeId={challengeId}
            onEdit={handleEditChallenge}
          />
          <ConfirmModalMemo
            visible={confirmModalVisible}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            title="Подтверждение удаления"
            message="Вы уверены, что хотите удалить этот челлендж?"
          />
        </div>
      </section>
    </>
  )
}
