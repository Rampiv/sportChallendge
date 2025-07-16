import React, { useEffect, useState } from "react"
import { Checkbox, Select } from "antd"
import "./ChallengeModal.scss"
import { useAppSelector } from "../../app/hooks"
import { RootState } from "../../app/store"
import { Link } from "react-router"

interface AddChallengeModalProps {
  visible: boolean
  onClose: () => void
  edit: boolean
  userId: string | undefined
  challengeId: string
  onAdd: (
    title: string,
    target: number,
    group: string,
    isSingleUse?: boolean,
  ) => void
  onEdit: (
    title: string,
    target: number,
    group: string,
    isSingleUse?: boolean,
  ) => void
}

export const ChallengeModal: React.FC<AddChallengeModalProps> = ({
  visible,
  onClose,
  onAdd,
  edit,
  userId,
  challengeId,
  onEdit,
}) => {
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [group, setGroup] = useState("")
  const [error, setError] = useState("")
  const [groupVisible, setGroupVisible] = useState(false)
  const [isSingleUse, setIsSingleUse] = useState(false)

  const { dailyChallenges } = useAppSelector(
    (state: RootState) => state.challenges,
  )

  useEffect(() => {
    if (edit) {
      const challengeToEdit = dailyChallenges.find(
        item => item.id === challengeId,
      )
      if (challengeToEdit) {
        setTitle(challengeToEdit.title)
        setTarget(`${challengeToEdit.target}`)
        setGroup(challengeToEdit.group || "")
        setIsSingleUse(challengeToEdit.isSingleUse || false) // Инициализируем текущее значение
      }
    } else {
      setTitle("")
      setTarget("")
      setGroup("")
      setGroupVisible(false)
    }
  }, [edit])

  const handleAdd = async () => {
    const targetNumber = parseInt(target, 10)
    if (edit && userId) {
      onEdit(title, Number(target), group, isSingleUse)
    } else if (
      title.trim() &&
      !isNaN(targetNumber) &&
      targetNumber > 0 &&
      group.trim()
    ) {
      onAdd(title, targetNumber, group, isSingleUse)
      setTitle("")
      setTarget("")
      setIsSingleUse(false)
    } else {
      setError("Необходимо заполнить все поля")
    }
  }

  const handleChange = (value: string) => {
    if (value === "custom") {
      setGroupVisible(true)
      setGroup("")
    } else {
      setGroupVisible(false)
      setGroup(value)
    }
  }

  const addUserGroup = () => {
    const uniqueGroups = dailyChallenges.reduce(
      (acc, item) => {
        if (item.group && !acc.some(group => group.value === item.group)) {
          acc.push({ value: item.group, label: item.group })
        }
        return acc
      },
      [] as Array<{ value: string; label: string }>,
    )

    return [
      ...uniqueGroups,
      { value: "custom", label: <strong>Создать группу</strong> },
    ]
  }

  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {edit
            ? "Редактировать ежедневное испытание"
            : "Добавить ежедневное испытание"}{" "}
          <Link
            to={edit ? "/faq?question=6" : "/faq?question=5"}
            className="faq-link faq-link-small"
          >
            FAQ
          </Link>
        </h2>
        <span className="modal-error">{error}</span>
        <input
          className={`modal-input ${error && !title ? "modal-error-input" : ""}`.trim()}
          type="text"
          placeholder="Название испытания"
          value={title}
          required
          onChange={e => setTitle(e.target.value)}
        />

        <input
          className={`modal-input ${error && !target ? "modal-error-input" : ""}`.trim()}
          type="number"
          placeholder="Количество"
          value={target}
          required
          onChange={e => setTarget(e.target.value)}
        />

        <Select
          defaultValue="Выберете группу"
          className={`modal-select ${error && !group ? "modal-error-input" : ""}`}
          onChange={handleChange}
          options={addUserGroup()}
        />

        <input
          className={`modal-input ${error && !group ? "modal-error-input" : ""} ${!groupVisible ? "hide" : ""}`.trim()}
          type="text"
          placeholder="Группа"
          value={group}
          onChange={e => {
            if (groupVisible) {
              setGroup(e.target.value)
            }
          }}
        />

        <Checkbox
          className="modal-checkbox"
          onChange={() => setIsSingleUse(!isSingleUse)}
          checked={isSingleUse}
        >
          Одноразовая задача{" "}
          <Link to={"/faq?question=7"} className="faq-link faq-link-small">
            FAQ
          </Link>
        </Checkbox>

        <div className="modal-button-container">
          <button className="modal-button cancel" onClick={onClose}>
            Отмена
          </button>

          <button className="modal-button add" onClick={handleAdd}>
            {edit ? "Изменить" : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  )
}
