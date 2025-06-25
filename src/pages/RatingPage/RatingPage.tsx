import React from "react"
import { Navigation } from "../../components"

const NavigationMemo = React.memo(Navigation)

export const RatingPage = () => {
  return <>
  <NavigationMemo props={[{text: 'Вернуться на главную', href: '/'}]} /></>
}
