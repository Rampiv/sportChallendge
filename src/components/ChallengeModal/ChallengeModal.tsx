import React, { useState } from "react"
import { Select } from "antd"
import "./ChallengeModal.scss"
import { useAppSelector } from "../../app/hooks"
import { RootState } from "../../app/store"

interface AddChallengeModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (title: string, target: number, group: string) => void
}

export const ChallengeModal: React.FC<AddChallengeModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [group, setGroup] = useState("")
  const [error, setError] = useState("")
  const [groupVisible, setGroupVisible] = useState(false)

  const { dailyChallenges } = useAppSelector(
    (state: RootState) => state.challenges,
  )

  const handleAdd = () => {
    const targetNumber = parseInt(target, 10)
    if (
      title.trim() &&
      !isNaN(targetNumber) &&
      targetNumber > 0 &&
      group.trim()
    ) {
      onAdd(title, targetNumber, group)
      setTitle("")
      setTarget("")
      // setGroup("")
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

    return [...uniqueGroups, { value: "custom", label: <strong>Создать группу</strong> }]
  }

  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Добавить ежедневное испытание</h2>
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

        <div className="modal-button-container">
          <button className="modal-button cancel" onClick={onClose}>
            Отмена
          </button>

          <button className="modal-button add" onClick={handleAdd}>
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}
