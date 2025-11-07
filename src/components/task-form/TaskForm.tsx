import { useCallback, useEffect, useRef, useState, type FC, type FormEventHandler } from "react";
import styles from "./taskForm.module.css";
import clsx from "clsx";
import { useModals } from "../../state/modal-context/ModalProvider";
import type { Task, TaskStatus } from "../../types/general";
import { useDb } from "../../state/db-context/DbProvider";

const TITLE_NAME = "title";
const DESCRIPTION_NAME = "description";

export interface TaskFormProps {
  initialStatus: TaskStatus;
  onSuccess: (newTask: Task) => void;
}

export const TaskForm: FC<TaskFormProps> = ({ initialStatus, onSuccess }) => {
  const { popModal } = useModals();
  const { dbReady, createTask } = useDb();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      if (!dbReady) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const title = formData.get(TITLE_NAME);
      const description = formData.get(DESCRIPTION_NAME);

      if (!title || typeof title !== "string") {
        setErrorMessage("Please provide a title");
        return;
      }
      if (typeof description !== "string") {
        setErrorMessage("Invalid description");
        return;
      }

      const newTask = await createTask(title, description ?? "", initialStatus);
      onSuccess(newTask);
    },
    [dbReady, initialStatus, createTask, onSuccess]
  );

  useEffect(() => {
    const titleInput = titleInputRef.current;

    if (titleInput) {
      titleInput.focus();
    }

    // would implement a focus trap with more time
  }, []);

  return (
    <form className={styles.form__root} onSubmit={handleSubmit}>
      <label>
        Title
        <input name={TITLE_NAME} onInput={() => setErrorMessage(null)} ref={titleInputRef} />
      </label>
      <label>
        Description
        <input name={DESCRIPTION_NAME} onInput={() => setErrorMessage(null)} />
      </label>
      <div className={styles.form__buttons}>
        <button className={clsx("body-lg")} type="submit" onClick={popModal}>
          Cancel
        </button>
        <button className={clsx("body-lg")} type="submit" disabled={!dbReady}>
          Submit
        </button>
      </div>
      {errorMessage && <p className={clsx("body-lg", styles.form__error)}>{errorMessage}</p>}
    </form>
  );
};
