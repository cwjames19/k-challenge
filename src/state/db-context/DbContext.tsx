import type { Task, TaskStatus } from "../../types/general";

export type DbContextState = {
  dbReady: boolean;
  db: IDBDatabase | null;
  createTask: (title: string, description: string, status?: TaskStatus) => Promise<Task>;
};
