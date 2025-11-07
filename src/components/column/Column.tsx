import { useCallback, type FC } from "react";
import type { Task, TaskStatus } from "../../types/general";
import styles from "./column.module.css";
import { Card } from "../card/Card";
import { getTaskStatusString } from "../../lib/helpers";
import { useModals } from "../../state/modal-context/ModalProvider";
import { TaskForm } from "../task-form/TaskForm";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

export interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  handleAddNewTask: (newTask: Task) => void;
  handleDeleteTask: (id: number) => void;
  activeTask?: Task;
}

export const Column: FC<ColumnProps> = ({
  status,
  tasks,
  handleAddNewTask,
  handleDeleteTask,
  activeTask,
}) => {
  const { setNodeRef } = useDroppable({ id: status });
  const { pushModal } = useModals();

  const handleOpenCreateModal: () => void = useCallback(() => {
    pushModal({
      title: "Add new task",
      hideClose: false,
      content: <TaskForm initialStatus={status} onSuccess={handleAddNewTask} />,
    });
  }, [pushModal, status, handleAddNewTask]);

  return (
    <div className={clsx(styles.column)} ref={setNodeRef}>
      <div className={styles.column__topRow}>
        <p className="body-lg">{getTaskStatusString(status)}</p>
        <button onClick={handleOpenCreateModal} className={styles.column__addButton}>
          +
        </button>
      </div>
      <div className={styles.column__cardContainer}>
        {tasks.map((task) => (
          <Card key={task.id} task={task} onDelete={handleDeleteTask} activeTask={activeTask} />
        ))}
      </div>
    </div>
  );
};
