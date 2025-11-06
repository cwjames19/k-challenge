import { TaskStatus } from "../types/general";

export const getTaskStatusString: (s: TaskStatus) => string = (s) => {
  switch (s) {
    case TaskStatus.TO_DO: {
      return "To do";
    }
    case TaskStatus.IN_PROGRESS: {
      return "In progress";
    }
    case TaskStatus.DONE: {
      return "Done";
    }
    default: {
      throw new Error("Unrecognized TaskStatus");
    }
  }
};
