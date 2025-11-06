import type { FC } from "react";
import styles from "./board.module.css";
import { TaskStatus } from "../../types/general";
import { Column } from "../column/Column";

export const Board: FC = () => {
  return (
    <div className={styles.board}>
      <Column status={TaskStatus.TO_DO} />
      <Column status={TaskStatus.IN_PROGRESS} />
      <Column status={TaskStatus.DONE} />
    </div>
  );
};
