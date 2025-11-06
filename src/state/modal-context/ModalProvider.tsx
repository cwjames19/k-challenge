import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  // useRef,
  useState,
  type FC,
  type MouseEventHandler,
  type PropsWithChildren,
} from "react";
import { type ModalContextState } from "./ModalContext";
import { Modal, type ModalProps } from "../../components/modal/Modal";
import { createPortal } from "react-dom";
import styles from "./modalContext.module.css";

const ModalContext = createContext<ModalContextState | null>(null);

export const ModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [modals, setModals] = useState<ModalProps[]>([]);

  const pushModal: (newModalProps: ModalProps) => void = useCallback((newModalProps) => {
    setModals((current) => {
      return [...current, newModalProps];
    });
  }, []);

  const popModal: () => void = useCallback(() => {
    setModals((current) => {
      return current.slice(0, -1);
    });
  }, []);

  const handleClickaway: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        popModal();
      }
    },
    [popModal]
  );

  const value = useMemo(
    () => ({
      pushModal,
      popModal,
    }),
    [pushModal, popModal]
  );

  const modalsRoot = document.getElementById("modals-root");

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modalsRoot !== null &&
        modals.length > 0 &&
        createPortal(
          <div className={styles.modals__overlay} onClick={handleClickaway}>
            {modals.map((modal, index) => (
              <div className={styles.modal__wrapper} key={`${modal.title ?? ""}-${index}`}>
                <Modal {...modal} />
              </div>
            ))}
          </div>,
          modalsRoot,
          "modals"
        )}
    </ModalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModals: () => ModalContextState = () => {
  const ctx = useContext(ModalContext);

  if (!ctx) {
    throw new Error("useModals must be called from within a ModalsProvider.");
  }

  return ctx;
};
