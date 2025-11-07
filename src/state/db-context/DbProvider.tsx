import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { type DbContextState } from "./DbContext";
import { TaskStatus, type NewTask, type Task } from "../../types/general";

const KANBAN_DB_NAME = "cj-kanban-db";

const DbContext = createContext<DbContextState>({
  db: null,
  dbReady: false,
  createTask: () => Promise.resolve({} as Task),
});

const seedData: NewTask[] = [
  {
    title: "Task One",
    description: "This is my first task",
    status: TaskStatus.TO_DO,
    index: 0,
  },
  {
    title: "Task Two",
    description: "This is my second task",
    status: TaskStatus.TO_DO,
    index: 1,
  },
  {
    title: "Task Three",
    description: "This is my third task",
    status: TaskStatus.IN_PROGRESS,
    index: 0,
  },
  {
    title: "Task Four",
    description: "This is my fourth task",
    status: TaskStatus.IN_PROGRESS,
    index: 1,
  },
  {
    title: "Task Five",
    description: "This is my fifth task",
    status: TaskStatus.IN_PROGRESS,
    index: 2,
  },
];

export const DbProvider: FC<PropsWithChildren> = ({ children }) => {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const dbRequest = indexedDB.open(KANBAN_DB_NAME, 11);

    dbRequest.onupgradeneeded = function () {
      const newDb = this.result;

      newDb.deleteObjectStore("tasks");

      if (!newDb.objectStoreNames.contains("tasks")) {
        const taskObjectStore = newDb.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });

        taskObjectStore.createIndex("status", "status", { unique: false });

        taskObjectStore.transaction.oncomplete = () => {
          const store = newDb.transaction("tasks", "readwrite").objectStore("tasks");
          seedData.forEach((t) => {
            store.add(t);
          });
        };
      }
    };

    dbRequest.onsuccess = function () {
      const newDb = this.result;

      newDb.onerror = (error) => {
        console.error("db error: ", error);
      };

      setDb(newDb);
    };

    dbRequest.onerror = () => {
      console.error(dbRequest.error);
    };
  }, [setDb]);

  const createTask: (title: string, description: string, status?: TaskStatus) => Promise<Task> = useCallback(
    async (title, description, status = TaskStatus.TO_DO) => {
      if (!db) {
        throw new Error("Should not be calling this when db is not ready");
      }

      const lastIndex = await new Promise<number>((resolve) => {
        let i = 0;
        const store = db.transaction("tasks", "readwrite").objectStore("tasks");
        const index = store.index("status");

        index.openCursor().onsuccess = (event) => {
          // TS only recognizes parameter as a non-specific Event type
          const cursor = (event.target as unknown as IDBRequest).result;

          if (cursor) {
            if (cursor.key === status) {
              i = Math.max(cursor.value.index, i);
            }

            cursor.continue();
          } else {
            resolve(i);
          }
        };

        index.openCursor().onerror = () => {
          resolve(i);
        };
      });

      const newTask: NewTask = {
        title,
        description,
        status,
        index: lastIndex + 1,
      };

      return await new Promise<Task>((resolve) => {
        let id: number;
        const transaction = db.transaction("tasks", "readwrite");

        transaction.oncomplete = () => {
          if (typeof id !== "number") {
            throw new Error("Could not determine id of new record");
          }

          resolve({ ...newTask, id });
        };

        const store = transaction.objectStore("tasks");
        const request = store.add(newTask);
        request.onsuccess = (event) => {
          id = (event.target as IDBRequest<number>).result;
        };
      });
    },
    [db]
  );

  const value = useMemo(
    () => ({
      db,
      dbReady: !!db,
      createTask,
    }),
    [db, createTask]
  );

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDb: () => DbContextState = () => {
  const ctx = useContext(DbContext);

  if (!ctx) {
    throw new Error("useDb must be called from within a DbProvider.");
  }

  return ctx;
};
