import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";
import styles from "./UnsavedChangesModal.module.scss";

type UnsavedChangesModalProps = {
  description?: string;
  error?: string;
  isOpen: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function UnsavedChangesModal({
  description = "В текущей форме есть изменения. Сохраните их, чтобы продолжить переход.",
  error = "",
  isOpen,
  isSaving = false,
  onCancel,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Есть несохраненные изменения"
      onClose={onCancel}
      footer={
        <>
          <Button disabled={isSaving} variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button disabled={isSaving} variant="danger" onClick={onDiscard}>
            Не сохранять
          </Button>
          <Button
            disabled={isSaving}
            icon="save"
            isLoading={isSaving}
            onClick={onSave}
          >
            Сохранить
          </Button>
        </>
      }
    >
      <div className={styles.unsavedChanges}>
        <p>{description}</p>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </Modal>
  );
}
