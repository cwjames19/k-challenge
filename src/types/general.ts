export enum TaskStatus {
  TO_DO = "TO_DO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export type Task = {
  title: string;
  description: string;
  status: TaskStatus;
  index: number;
  id: number;
};

export type NewTask = Omit<Task, "id">;
