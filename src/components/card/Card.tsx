import { useCallback, useEffect, useRef, useState, type FC } from "react";
import clsx from "clsx";
import styles from "./card.module.css";
import type { Task } from "../../types/general";
import { CloseIcon } from "../close-icon/CloseIcon";
import { useDb } from "../../state/db-context/DbProvider";
import { EditIcon } from "../edit-icon/EditIcon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface CardProps {
  task: Task;
  onDelete: (id: number) => void;
  isOverlay?: boolean;
  activeTaskId?: number;
}

export const Card: FC<CardProps> = ({ task, onDelete, isOverlay = false, activeTaskId }) => {
  const { db, dbReady } = useDb();
  const [editing, setEditing] = useState<boolean>(false);
  const titleRef = useRef<HTMLParagraphElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const opacity = activeTaskId === task.id ? (isOverlay ? 0.8 : 0) : 1;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity,
  };

  const handleSaveTitle: () => void = useCallback(() => {
    const updateTitle = async (newTitle: string) => {
      const transaction = db!.transaction("tasks", "readwrite");

      transaction.oncomplete = () => {
        setEditing(false);
      };

      const store = transaction.objectStore("tasks");
      store.put({ ...task, title: newTitle });
    };

    const titleEl = titleRef.current;

    if (titleEl !== null && db !== null) {
      updateTitle(titleEl.innerText);
    }

    setEditing(false);
  }, [db, task]);

  const handleEditTitle = useCallback(() => {
    setEditing(true);
  }, []);

  const handleDeleteTask = useCallback(() => {
    const deleteTaskAsync: (id: number) => Promise<void> = async (id) => {
      if (!db) {
        return;
      }

      return new Promise((resolve) => {
        const transaction = db.transaction("tasks", "readwrite");

        transaction.oncomplete = () => {
          resolve(undefined);
        };

        const store = transaction.objectStore("tasks");

        store.delete(id);
      })
        .then(() => {
          onDelete(id);
        })
        .catch(() => {
          // do nothing;
        });
    };

    if (db !== null) {
      deleteTaskAsync(task.id);
    }
  }, [task.id, db, onDelete]);

  useEffect(() => {
    const titleEl = titleRef.current;

    if (titleEl && editing) {
      titleEl.focus();
    }
  }, [editing]);

  return (
    <div className={styles.card} ref={setNodeRef} style={style}>
      <div className={styles.card__dragHandle} {...attributes} {...listeners}>
        <div>
          <div />
          <div />
          <div />
        </div>
      </div>
      <div className={styles.card__content}>
        <div className={styles.card__topRow}>
          <div className={styles.card__titleContainer}>
            <p contentEditable={editing} className={clsx("body-lg", styles.card__title)} ref={titleRef}>
              {task.title}
            </p>
            {editing ? (
              <button aria-label="Save title" onClick={handleSaveTitle}>
                ✅
              </button>
            ) : (
              <button aria-label="Edit title" onClick={handleEditTitle}>
                <EditIcon />
              </button>
            )}
          </div>
          <button disabled={!dbReady} onClick={handleDeleteTask} className={styles.card__closeButton}>
            <CloseIcon style={{ color: dbReady ? "red" : "gray", width: "24px", height: "24px" }} />
          </button>
        </div>
        <p className={clsx("body-md", styles.card__description)}>{task.description}</p>
      </div>
    </div>
  );
};
