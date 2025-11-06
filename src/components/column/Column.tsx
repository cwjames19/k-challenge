import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import type { Task, TaskStatus } from "../../types/general";
import styles from "./column.module.css";
import { Card } from "../card/Card";
import { getTaskStatusString } from "../../lib/helpers";
import { useModals } from "../../state/modal-context/ModalProvider";
import { useDb } from "../../state/db-context/DbProvider";
import { TaskForm } from "../task-form/TaskForm";

export interface ColumnProps {
  status: TaskStatus;
}

export const Column: FC<ColumnProps> = ({ status }) => {
  const { pushModal, popModal } = useModals();
  const { dbReady, getTasksByStatus } = useDb();
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleAddNewTask = useCallback(
    (newTask: Task) => {
      setTasks((current) => [...current, newTask]);
      popModal();
    },
    [popModal]
  );

  const handleDeleteTask = useCallback((id: number) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  const handleOpenCreateModal: () => void = useCallback(() => {
    pushModal({
      title: "Add new task",
      hideClose: false,
      content: <TaskForm initialStatus={status} onSuccess={handleAddNewTask} />,
    });
  }, [pushModal, status, handleAddNewTask]);

  useEffect(() => {
    const asyncGetTasks = async () => {
      const newTasks = await getTasksByStatus(status);

      setTasks(newTasks);
    };

    if (dbReady) {
      asyncGetTasks();
    }
  }, [dbReady, getTasksByStatus, status]);

  const sortedTasks = useMemo(() => tasks.sort((a, b) => (a.index < b.index ? -1 : 1)), [tasks]);

  return (
    <div className={styles.column}>
      <div className={styles.column__topRow}>
        <p className="body-lg">{getTaskStatusString(status)}</p>
        <button onClick={handleOpenCreateModal} className={styles.column__addButton}>
          +
        </button>
      </div>
      <div className={styles.column__cardContainer}>
        {sortedTasks.map((task) => (
          <Card key={task.id} task={task} onDelete={handleDeleteTask} />
        ))}
      </div>
    </div>
  );
};
