import { useCallback, useEffect, useRef, useState, type FC } from "react";
import clsx from "clsx";
import styles from "./card.module.css";
import type { Task } from "../../types/general";
import { CloseIcon } from "../close-icon/CloseIcon";
import { useDb } from "../../state/db-context/DbProvider";
import { EditIcon } from "../edit-icon/EditIcon";

export interface CardProps {
  task: Task;
  onDelete: (id: number) => void;
}

export const Card: FC<CardProps> = ({ task, onDelete }) => {
  const { db, dbReady } = useDb();
  const [editing, setEditing] = useState<boolean>(false);
  const titleRef = useRef<HTMLParagraphElement | null>(null);

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

  const handleDeleteCard = useCallback(() => {
    const deleteTask: (id: number) => Promise<void> = async (id) => {
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
      deleteTask(task.id);
    }
  }, [task.id, db, onDelete]);

  useEffect(() => {
    const titleEl = titleRef.current;

    if (titleEl && editing) {
      titleEl.focus();
    }
  }, [editing]);

  return (
    <div className={styles.card}>
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
        <button disabled={!dbReady} onClick={handleDeleteCard} className={styles.card__closeButton}>
          <CloseIcon style={{ color: dbReady ? "red" : "gray", width: "24px", height: "24px" }} />
        </button>
      </div>
      <p className={clsx("body-md", styles.card__description)}>{task.description}</p>
    </div>
  );
};
