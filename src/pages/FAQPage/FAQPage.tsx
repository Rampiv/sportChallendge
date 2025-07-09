import { useEffect, useState } from "react"
import { Collapse } from "antd"
import { useLocation } from "react-router"
import { Navigation } from "../../components"
import "./FAQPage.scss"

export const FAQPage = () => {
  const location = useLocation()
  const [activeKey, setActiveKey] = useState<string | string[]>([])

  // Данные для FAQ
  const faqItems = [
    {
      key: "1",
      label: "Как засчитывается серия выполнений?",
      children: (
        <p className="faq__descr">
          1. Выполните хотя бы <strong>одно</strong> испытание за день → серия{" "}
          <strong>увеличится</strong> на +1
          <br />
          2. Даже если выполните несколько испытаний за день → серия всё равно
          увеличится только на +1
          <br />
          3. <strong>Пропустите</strong> день без выполнения испытаний → серия{" "}
          <strong>обнулится</strong>
        </p>
      ),
    },
    {
      key: "2",
      label: "Как засчитывается рейтинг заданий?",
      children: (
        <p className="faq__descr">
          1. Выполните <strong>одно</strong> испытание → количество{" "}
          <strong>увеличится</strong> на +1
          <br />
          2. В статистике отображается сколько заданий вы выполнили{" "}
          <strong>за все время</strong> пользования данного приложения 3. Люди с
          0 выполненных заданий не отображаются.
        </p>
      ),
    },
    {
      key: "3",
      label: "Статистика",
      children: (
        <p className="faq__descr">
          Статистика отображает дни (ось Х), количество выполнений (ось Y). Дней
          с 0 выполнений статистика не засчитывает вообще.
        </p>
      ),
    },
    {
      key: "4",
      label: "Достижения",
      children: (
        <p className="faq__descr">
          Все, кто учавствовал в еженедельном(общем) ивенте - получают
          достижение. 
          <br />
          <strong>В каком случае засчитывается участие?</strong>
          <br />
          - Если за время существования ивента пользователь хотя бы раз выполнил свое ежедневное испытание, то он автоматически включается в список пользователей, которым будет начислено достижение
          <br />
        </p>
      ),
    },
  ]

  // Обработка открытия конкретного пункта при загрузке
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const questionKey = params.get("question")

    if (questionKey) {
      setActiveKey(questionKey)
    }
  }, [location])

  return (
    <>
      <Navigation />
      <section className="faq">
        <div className="container">
          <h1>Часто задаваемые вопросы</h1>

          <Collapse
            activeKey={activeKey}
            onChange={keys => setActiveKey(keys)}
            items={faqItems}
          />
        </div>
      </section>
    </>
  )
}
