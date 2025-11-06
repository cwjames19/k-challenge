import type { ModalProps } from "../../components/modal/Modal";

export interface ModalContextState {
  pushModal: (modalProps: ModalProps) => void;
  popModal: () => void;
}
