import { Link } from "react-router"
import "./Navigation.scss"
import { HomeIcon, Rating, Statistic, UserIcon } from "../../assets/svg"

const links = [
  { text: <HomeIcon />, href: "/" },
  { text: <Rating />, href: "/rating" },
  { text: <Statistic />, href: "/statistic" },
  { text: <UserIcon />, href: "/account" },
]

export const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="container">
        <ul className="navigation__list">
          {links.map((item, index) => {
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
