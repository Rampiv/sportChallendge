import React from "react"
import './ConfirmModal.scss'

interface ConfirmModalProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
}) => {
  if (!visible) return null

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <h3 className="confirm-modal__title">{title}</h3>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button
            className="confirm-modal__btn confirm-modal__btn-cancel"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            className="confirm-modal__btn confirm-modal__btn-confirm"
            onClick={onConfirm}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}
