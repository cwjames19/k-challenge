import type { FC, PropsWithChildren } from "react";
import { ModalProvider } from "../state/modal-context/ModalProvider";
import { DbProvider } from "../state/db-context/DbProvider";

export const Provider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <DbProvider>
      <ModalProvider>{children}</ModalProvider>
    </DbProvider>
  );
};
