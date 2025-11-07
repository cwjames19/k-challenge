import { useCallback, type FC } from "react";
import type { Task, TaskStatus } from "../../types/general";
import styles from "./column.module.css";
import { Card } from "../card/Card";
import { getTaskStatusString } from "../../lib/helpers";
import { useModals } from "../../state/modal-context/ModalProvider";
import { TaskForm } from "../task-form/TaskForm";

export interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  handleAddNewTask: (newTask: Task) => void;
  handleDeleteTask: (id: number) => void;
  activeTaskId?: number;
}

export const Column: FC<ColumnProps> = ({
  status,
  tasks,
  handleAddNewTask,
  handleDeleteTask,
  activeTaskId,
}) => {
  const { pushModal } = useModals();

  const handleOpenCreateModal: () => void = useCallback(() => {
    pushModal({
      title: "Add new task",
      hideClose: false,
      content: <TaskForm initialStatus={status} onSuccess={handleAddNewTask} />,
    });
  }, [pushModal, status, handleAddNewTask]);

  return (
    <div className={styles.column}>
      <div className={styles.column__topRow}>
        <p className="body-lg">{getTaskStatusString(status)}</p>
        <button onClick={handleOpenCreateModal} className={styles.column__addButton}>
          +
        </button>
      </div>
      <div className={styles.column__cardContainer}>
        {tasks.map((task) => (
          <Card key={task.id} task={task} onDelete={handleDeleteTask} activeTaskId={activeTaskId} />
        ))}
      </div>
    </div>
  );
};
