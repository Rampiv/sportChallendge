import "./Statisctic.scss"
import { Navigation } from "../../components"
import { useAppSelector } from "../../app/hooks"
import { RootState } from "../../app/store"
import { useEffect, useRef, useState } from "react"
import { Chart } from "chart.js/auto"
import { onValue, ref } from "firebase/database"
import { database } from "../../firebase/config"
import { Achivment } from "../../assets/svg"
import { Link } from "react-router"

// Форматирование даты в DD/MM/YYYY
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0") // Месяцы с 0
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Генерация случайного цвета
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  return `hsla(${hue}, 70%, 50%, 0.6)`
}

export const StatisticPage = () => {
  const { dailyChallenges } = useAppSelector(
    (state: RootState) => state.challenges,
  )
  const [weeklyChallenges, setWeeklyChallenges] = useState<
    Array<{
      id: string
      title: string
      participantsCount: number
      isCompleted: boolean
      users?: string[]
    }>
  >([])

  const { user } = useAppSelector((state: RootState) => state.auth)

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Формируем данные для таблицы
  useEffect(() => {
    if (!dailyChallenges || dailyChallenges.length === 0) return

    // Словарь для хранения дат и их количества по каждому challenge
    const dataByTitle: Record<
      string,
      { dates: Record<string, number>; color: string }
    > = {}

    dailyChallenges.forEach(challenge => {
      const title = challenge.title
      const timestamps = challenge.isCompletedData || []

      const dateCountMap: Record<string, number> = {}

      timestamps.forEach((ts: number) => {
        const dateKey = formatDate(ts)
        dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1
      })

      dataByTitle[title] = {
        dates: dateCountMap,
        color: getRandomColor(),
      }
    })

    // Получаем все уникальные даты
    const allDatesSet = new Set<string>()
    Object.values(dataByTitle).forEach(({ dates }) =>
      Object.keys(dates).forEach(date => allDatesSet.add(date)),
    )
    const sortedDates = Array.from(allDatesSet).sort(
      (a, b) =>
        new Date(a.split("/").reverse().join("-")).getTime() -
        new Date(b.split("/").reverse().join("-")).getTime(),
    )

    // Формируем datasets
    const datasets = Object.entries(dataByTitle).map(
      ([title, { dates, color }]) => ({
        label: title,
        data: sortedDates.map(date => dates[date] || 0),
        backgroundColor: color,
        borderWidth: 1,
      }),
    )

    // Уничтожаем предыдущий график
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current?.getContext("2d")
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: sortedDates,
          datasets: datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                autoSkip: false,
                minRotation: 50,
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      })
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [dailyChallenges])

  // Получаем данные о еженедельных испытаниях
  useEffect(() => {
    if (!user) return

    const weeklyRef = ref(database, "weeklyChallenges")

    const unsubscribeWeekly = onValue(weeklyRef, snapshot => {
      const data = snapshot.val()
      if (data) {
        const challenges = Object.entries(data).map(
          ([id, challenge]: [string, any]) => ({
            id,
            title: challenge.title,
            participantsCount: challenge.users?.length || 0,
            isCompleted: challenge.isCompleted,
            users: challenge.users || [],
          }),
        )
        setWeeklyChallenges(challenges)
      }
    })

    return () => {
      unsubscribeWeekly()
    }
  }, [user?.uid])

  return (
    <>
      <Navigation />
      <section className="statistic">
        <div className="container">
          <h2 className="statistic__h2">
            Статистика{" "}
            <Link to="/faq?question=3" className="faq-link faq-link-small">
              FAQ
            </Link>
          </h2>
          <canvas
            id="myChart"
            ref={chartRef}
            className="statistic__canvas"
          ></canvas>
          <h2 className="statistic__h2">
            Достижения{" "}
            <Link to="/faq?question=4" className="faq-link faq-link-small">
              FAQ
            </Link>
          </h2>
          <ul className="statistic__list">
            {weeklyChallenges
              .filter(
                challenge =>
                  challenge.isCompleted &&
                  challenge.users?.includes(user?.uid || ""),
              )
              .map(challenge => (
                <li key={challenge.id} className="statistic__item">
                  <h3 className="statistic__h3">
                    <Achivment />
                    {challenge.title}
                  </h3>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </>
  )
}
