import React, { useState } from "react"
import "./ChallengeModal.scss"

interface AddChallengeModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (title: string, target: number) => void
}

export const ChallengeModal: React.FC<AddChallengeModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")

  const handleAdd = () => {
    const targetNumber = parseInt(target, 10)
    if (title.trim() && !isNaN(targetNumber) && targetNumber > 0) {
      onAdd(title, targetNumber)
      setTitle("")
      setTarget("")
    }
  }

  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Добавить ежедневное испытание</h2>

        <input
          className="modal-input"
          type="text"
          placeholder="Название испытания"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          className="modal-input"
          type="number"
          placeholder="Количество"
          value={target}
          onChange={e => setTarget(e.target.value)}
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
