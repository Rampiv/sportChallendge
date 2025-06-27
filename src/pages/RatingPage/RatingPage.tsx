import React, { useEffect } from "react"
import { Loading, Navigation } from "../../components"
import {
  fetchUserRankings,
  selectRankingsLoading,
  selectUserRankings,
} from "../../features/statsSlice/statesSlice"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { HomeIcon, Rating, UserIcon } from "../../assets/svg"
import './RatingPage.scss'

const NavigationMemo = React.memo(Navigation)

export const RatingPage = () => {
  const dispatch = useAppDispatch()
  const rankings = useAppSelector(selectUserRankings)
  const isLoading = useAppSelector(selectRankingsLoading)

  useEffect(() => {
    dispatch(fetchUserRankings())
  }, [dispatch])

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      <NavigationMemo props={[{ text: <HomeIcon />, href: "/" },
                { text: <Rating />, href: "/rating" },
                { text: <UserIcon />, href: "/account" },]} />
      <section className="rating">
        <div className="container">
          <h2 className="rating__h2">Рейтинг пользователей</h2>
        <ul className="rating__list">
          {rankings.map(user => (
            <li key={user.userId} className="rating__item">
              <strong>#{user.rank}</strong> {user.userName} : Количество испытаний: <strong>{user.completedChallenges}</strong>
            </li>
          ))}
        </ul>
        </div>
      </section>
    </>
  )
}
