import type { FC } from "react";
import styles from "./modal.module.css";
import { useModals } from "../../state/modal-context/ModalProvider";
import { CloseIcon } from "../close-icon/CloseIcon";

export interface ModalProps {
  content?: React.ReactNode;
  title?: string;
  hideClose?: boolean;
}

export const Modal: FC<ModalProps> = ({ content, title }) => {
  const { popModal } = useModals();

  return (
    <dialog className={styles.modal__card}>
      <div className={styles.modal__topRow}>
        {title && <h1 className="heading-h4">{title}</h1>}
        <button className={styles.modal__closeButton} onClick={popModal}>
          <CloseIcon />
        </button>
      </div>
      <hr className={styles.modal__divider} />
      {content}
    </dialog>
  );
};
