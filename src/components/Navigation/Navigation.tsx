import { Link } from "react-router"
import "./Navigation.scss"
import { ReactNode } from "react"

interface Props {
  text: ReactNode
  href: string
}
interface ArrayProps {
  props: Props[]
}

export const Navigation = ({ props }: ArrayProps) => {
  return (
    <nav className="navigation">
      <div className="container">
        <ul className="navigation__list">
          {props.map((item, index) => {
            return (
              <li className="navigation__item" key={`${item.text} ${index}`}>
                <Link
                  to={item.href}
                  className="navigation__link"
                  key={`${item.text} ${item.href}`}
                >
                  {item.text}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
