import React, { useEffect } from "react"
import { Loading, Navigation } from "../../components"
import {
  fetchUserRankings,
  fetchUserStreaks,
  selectRankingsLoading,
  selectUserRankings,
  selectStreaksLoading,
  selectUserStreaks,
} from "../../features/statsSlice/statesSlice"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import "./RatingPage.scss"
import { Link } from "react-router"

const NavigationMemo = React.memo(Navigation)

export const RatingPage = () => {
  const dispatch = useAppDispatch()
  const rankings = useAppSelector(selectUserRankings)
  const streaks = useAppSelector(selectUserStreaks)
  const isLoadingRankings = useAppSelector(selectRankingsLoading)
  const isLoadingStreaks = useAppSelector(selectStreaksLoading)

  useEffect(() => {
    dispatch(fetchUserRankings())
    dispatch(fetchUserStreaks())
  }, [dispatch])

  if (isLoadingRankings || isLoadingStreaks) {
    return <Loading />
  }

  // Сортируем пользователей по стрику (от большего к меньшему)
  const sortedByStreak = [...streaks].sort((a, b) => b.current - a.current)

  return (
    <>
      <NavigationMemo />
      <section className="rating">
        <div className="container">
          <h2 className="rating__h2">Рейтинг пользователей</h2>
          <h3 className="rating__h3">
            Количество выполненных заданий:{" "}
            <Link to="/faq?question=2" className="faq-link faq-link-small">
              FAQ
            </Link>
          </h3>
          <ul className="rating__list">
            {rankings
              .filter(user => user.completedChallenges > 0)
              .map(user => (
                <li
                  key={`${user.userId} ${user.rank}`}
                  className="rating__item"
                >
                  <strong>#{user.rank}</strong> {user.userName} : Количество
                  испытаний: <strong>{user.completedChallenges}</strong>
                </li>
              ))}
          </ul>

          <h3 className="rating__h3">
            Лучшая текущая серия выполнения:{" "}
            <Link to="/faq?question=1" className="faq-link faq-link-small">
              FAQ
            </Link>
          </h3>
          <ul className="rating__list">
            {sortedByStreak
              .filter(user => user.best > 0)
              .map((user, index) => (
                <li
                  key={`${user.userId} ${user.current} ${user.best}`}
                  className="rating__item"
                >
                  <strong>#{index + 1}</strong> {user.userName} : Текущая серия:{" "}
                  <strong>{user.current} дней</strong> | Лучший результат:{" "}
                  <strong>{user.best} дней</strong>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </>
  )
}
