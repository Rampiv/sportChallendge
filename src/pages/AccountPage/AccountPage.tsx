import React, { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import {
  updateUserEmail,
  updateUserProfile,
  updateUserPassword,
  logoutUser,
  deleteAccount,
  selectCurrentUser,
} from "../../features/authSlice/authSlice"
import { EyeVisible, HomeIcon, InfiniteSpinner } from "../../assets/svg"
import "./AccountPage.scss"
import { Navigation } from "../../components"

const NavigationMemo = React.memo(Navigation)

export const AccountPage = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{
    type: "error" | "success" | null
    message: string
  }>({ type: null, message: "" })

  // Состояния для форм
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
    showPassword: false,
  })

  const [profileForm, setProfileForm] = useState({
    displayName: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrentPassword: false,
    showNewPassword: false,
  })

  const [deleteForm, setDeleteForm] = useState({
    password: "",
    showPassword: false,
    confirmDelete: false,
  })

  // Заполняем данные пользователя при загрузке
  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || "",
      })
    }
  }, [user])

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ type: null, message: "" })

    try {
      await dispatch(
        updateUserEmail({
          newEmail: emailForm.newEmail,
          password: emailForm.password,
        }),
      ).unwrap()

      showModal("success", "Email успешно изменен")
      setEmailForm({
        newEmail: "",
        password: "",
        showPassword: false,
      })
    } catch (err) {
      showModal("error", "Ошибка при изменении email")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ type: null, message: "" })

    try {
      await dispatch(updateUserProfile(profileForm.displayName)).unwrap()
      showModal("success", "Имя пользователя успешно изменено")
    } catch (err) {
      showModal("error", "Ошибка при изменении имени")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ type: null, message: "" })

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showModal("error", "Новые пароли не совпадают")
      setLoading(false)
      return
    }

    try {
      await dispatch(
        updateUserPassword({
          newPassword: passwordForm.newPassword,
          currentPassword: passwordForm.currentPassword,
        }),
      ).unwrap()

      showModal("success", "Пароль успешно изменен")
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        showCurrentPassword: false,
        showNewPassword: false,
      })
    } catch (err) {
      showModal("error", "Ошибка при изменении пароля")
      console.log(err);
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await dispatch(logoutUser())
  }

  const handleDeleteAccount = async () => {
    if (!deleteForm.confirmDelete) {
      setDeleteForm({ ...deleteForm, confirmDelete: true })
      return
    }

    setLoading(true)
    setModal({ type: null, message: "" })

    try {
      await dispatch(deleteAccount(deleteForm.password)).unwrap()
    } catch (err) {
      showModal("error", "Ошибка при удалении аккаунта")
      setLoading(false)
    }
  }

  const showModal = (type: "error" | "success", message: string) => {
    setModal({ type, message })
  }

  // Эффект для автоматического скрытия модального окна
  useEffect(() => {
    if (modal.type) {
      const timer = setTimeout(() => {
        setModal({ type: null, message: "" })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [modal])

  if (!user) {
    return <div className="container">Пользователь не авторизован</div>
  }

  return (
    <>
      <NavigationMemo props={[{ text: <HomeIcon />, href: "/" }]} />
      <section className="account">
        <div className="container">
          {modal.type && (
            <div className={`account__modal ${modal.type}`}>
              <div className="account__modal-content">{modal.message}</div>
            </div>
          )}

          <ul className="account__list">
            {/* Секция изменения email */}
            <li className="account__item">
              <h2 className="account__h2">Изменение email</h2>
              <form onSubmit={handleUpdateEmail} className="account-form">
                <div className="account-form__group">
                  <label className="account-form__label">Текущий email</label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="account-form__input"
                  />
                </div>
                <div className="account-form__group">
                  <label className="account-form__label">Новый email</label>
                  <input
                    type="email"
                    value={emailForm.newEmail}
                    onChange={e =>
                      setEmailForm({ ...emailForm, newEmail: e.target.value })
                    }
                    required
                    className="account-form__input"
                  />
                </div>
                <div className="account-form__group">
                  <label className="account-form__label">Текущий пароль</label>
                  <div className="account-form__input-block">
                    <input
                      type={emailForm.showPassword ? "text" : "password"}
                      value={emailForm.password}
                      onChange={e =>
                        setEmailForm({ ...emailForm, password: e.target.value })
                      }
                      required
                      className="account-form__input"
                    />
                    <button
                      type="button"
                      className="account-form__btn-toggle"
                      onClick={() =>
                        setEmailForm({
                          ...emailForm,
                          showPassword: !emailForm.showPassword,
                        })
                      }
                    >
                      <EyeVisible />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="account__btn"
                >
                  {loading ? (
                    <InfiniteSpinner className={"account__loading"} />
                  ) : (
                    "Изменить email"
                  )}
                </button>
              </form>
            </li>

            {/* Секция изменения имени */}
            <li className="account__item">
              <h2 className="account__h2">Изменение имени</h2>
              <form onSubmit={handleUpdateProfile} className="account-form">
                <div className="account-form__group">
                  <label className="account-form__label">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        displayName: e.target.value,
                      })
                    }
                    required
                    className="account-form__input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="account__btn"
                >
                  {loading ? (
                    <InfiniteSpinner className={"account__loading"} />
                  ) : (
                    "Изменить имя"
                  )}
                </button>
              </form>
            </li>

            {/* Секция изменения пароля */}
            <li className="account__item">
              <h2 className="account__h2">Изменение пароля</h2>
              <form onSubmit={handleUpdatePassword}>
                <div className="account-form__group password-group">
                  <label className="account-form__label">Текущий пароль</label>
                  <div className="account-form__input-block">
                    <input
                      type={
                        passwordForm.showCurrentPassword ? "text" : "password"
                      }
                      value={passwordForm.currentPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                      className="account-form__input"
                    />
                    <button
                      type="button"
                      className="account-form__btn-toggle"
                      onClick={() =>
                        setPasswordForm({
                          ...passwordForm,
                          showCurrentPassword:
                            !passwordForm.showCurrentPassword,
                        })
                      }
                    >
                      <EyeVisible />
                    </button>
                  </div>
                </div>
                <div className="account-form__group password-group">
                  <label className="account-form__label">Новый пароль</label>
                  <div className="account-form__input-block">
                    <input
                      type={passwordForm.showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                      className="account-form__input"
                    />
                    <button
                      type="button"
                      className="account-form__btn-toggle"
                      onClick={() =>
                        setPasswordForm({
                          ...passwordForm,
                          showNewPassword: !passwordForm.showNewPassword,
                        })
                      }
                    >
                      <EyeVisible />
                    </button>
                  </div>
                </div>
                <div className="account-form__group">
                  <label className="account-form__label">
                    Подтвердите новый пароль
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    className="account-form__input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="account__btn"
                >
                  {loading ? (
                    <InfiniteSpinner className={"account__loading"} />
                  ) : (
                    "Изменить пароль"
                  )}
                </button>
              </form>
            </li>

            {/* Секция выхода и удаления аккаунта */}
            <li className="account__item">
              <ul className="account__list">
                <li className="account__item">
                  <h2 className="account__h2">Опасные действия</h2>

                  <button onClick={handleLogout} className="account__btn account__btn-danger">
                    Выйти из аккаунта
                  </button>
                </li>

                <li className="account__item">
                  <h3>Удаление аккаунта</h3>
                  <p className="account__delete-descr">
                    Это действие невозможно отменить. Все ваши данные будут
                    удалены.
                  </p>

                  {deleteForm.confirmDelete && (
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        handleDeleteAccount()
                      }}
                    >
                      <div className="account-form__group password-group">
                        <label className="account-form__label">
                          Подтвердите пароль
                        </label>
                        <div className="account-form__input-block">
                          <input
                            type={deleteForm.showPassword ? "text" : "password"}
                            value={deleteForm.password}
                            onChange={e =>
                              setDeleteForm({
                                ...deleteForm,
                                password: e.target.value,
                              })
                            }
                            required
                            className="account-form__input"
                          />
                          <button
                            type="button"
                            className="account-form__btn-toggle"
                            onClick={() =>
                              setDeleteForm({
                                ...deleteForm,
                                showPassword: !deleteForm.showPassword,
                              })
                            }
                          >
                            <EyeVisible />
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="account__btn account__btn-danger"
                      >
                        {loading ? (
                          <InfiniteSpinner className={"account__loading"} />
                        ) : (
                          <>Подтвердить удаление</>
                        )}
                      </button>
                    </form>
                  )}

                  {!deleteForm.confirmDelete && (
                    <button
                      onClick={() =>
                        setDeleteForm({ ...deleteForm, confirmDelete: true })
                      }
                      className="account__btn account__btn-danger"
                    >
                      Удалить аккаунт
                    </button>
                  )}
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}
