import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import styles from "./board.module.css";
import { TaskStatus, type Task } from "../../types/general";
import { Column } from "../column/Column";
import {
  DndContext,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDb } from "../../state/db-context/DbProvider";
import { Card } from "../card/Card";
import { useModals } from "../../state/modal-context/ModalProvider";

export const Board: FC = () => {
  const { db } = useDb();
  const { popModal } = useModals();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const getTasksByStatus = useCallback(
    (tasks: Task[], status: TaskStatus) => tasks.filter((t) => t.status === status),
    []
  );

  const findTask: (id: unknown) => Task = useCallback(
    (id: unknown) => {
      const task = allTasks.find((task) => task.id === id);

      if (!task) {
        // typically i would create better error handling than this
        console.error(`Tasks with id, ${id} not found`);
      }

      return task!;
    },
    [allTasks]
  );

  const assignNewIndices: (tasks: Task[]) => Task[] = (tasks) =>
    tasks
      .sort((a, b) => {
        return a.index <= b.index ? -1 : 1;
      })
      .map((task, index) => ({ ...task, index }));

  const persistTasksAsync = useCallback(
    async (newAllTasks: Task[]) => {
      if (db === null) {
        return;
      }

      return new Promise((resolve) => {
        const transaction = db.transaction("tasks", "readwrite");
        const store = transaction.objectStore("tasks");

        newAllTasks.forEach((task) => {
          store.put(task);
        });

        transaction.oncomplete = () => {
          resolve(undefined);
        };
      });
    },
    [db]
  );

  const handleDragStart: DndContextProps["onDragStart"] = useCallback(
    (event: DragStartEvent) => {
      const newActiveTask = findTask(event.active.id);

      if (newActiveTask) {
        setActiveTask(newActiveTask);
      }
    },
    [findTask]
  );

  const handleDragOver: DndContextProps["onDragOver"] = useCallback(
    (event: DragOverEvent) => {
      if (!event.over) {
        return;
      }
      const activeTask = findTask(event.active.id);
      const overTask = findTask(event.over.id);

      if (!overTask || !activeTask || overTask.id === activeTask.id) {
        return;
      }

      setAllTasks((current) =>
        current.map((task) => ({
          ...task,
          status: task.id === activeTask.id ? overTask.status : task.status,
          index: task.id === activeTask.id ? overTask.index : task.index,
        }))
      );
      setActiveTask({
        ...activeTask,
        status: overTask.status,
        index: overTask.index,
      });
    },
    [findTask]
  );

  const handleDragEnd: DndContextProps["onDragEnd"] = useCallback(
    (event: DragEndEvent) => {
      if (!event.over) {
        setActiveTask(null);
        return;
      }
      const activeTask = findTask(event.active.id);
      const overTask = findTask(event.over.id);

      if (!overTask || !activeTask || overTask.id === activeTask.id) {
        setActiveTask(null);
        return;
      }

      // update local state first
      const newTasks = [TaskStatus.TO_DO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]
        .map((status) => {
          const tasksByStatus = getTasksByStatus(allTasks, status);
          const tasksWithNewIndices = assignNewIndices(tasksByStatus);
          return [...tasksWithNewIndices];
        })
        .flat();
      setAllTasks(newTasks);

      // sync IndexedDB
      persistTasksAsync(newTasks);

      setActiveTask(null);
    },
    [findTask, getTasksByStatus, persistTasksAsync, allTasks]
  );

  const handleAddNewTask = useCallback(
    (newTask: Task) => {
      setAllTasks((current) => [...current, newTask]);
      popModal();
    },
    [popModal]
  );

  const handleDeleteTask = useCallback((id: number) => {
    setAllTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  useEffect(() => {
    const fetchAllTasksAsync = async () => {
      const newAllTasks: Task[] = await new Promise((resolve) => {
        const transaction = db!.transaction("tasks", "readonly");

        const store = transaction.objectStore("tasks");
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };

        getAllRequest.onerror = () => {
          console.error("failed to fetch all tasks on load: ", getAllRequest.error ?? "");
          resolve([]);
        };
      });

      setAllTasks(newAllTasks);
    };

    if (db !== null) {
      fetchAllTasksAsync();
    }
  }, [db]);

  const filteredTasks: Record<TaskStatus, { tasks: Task[]; sortedIds: number[] }> = useMemo(() => {
    const todo = allTasks
      .filter(({ status }) => status === TaskStatus.TO_DO)
      .sort((a, b) => (a.index < b.index ? -1 : 1));
    const inProgress = allTasks
      .filter(({ status }) => status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => (a.index < b.index ? -1 : 1));
    const done = allTasks
      .filter(({ status }) => status === TaskStatus.DONE)
      .sort((a, b) => (a.index < b.index ? -1 : 1));

    return {
      [TaskStatus.TO_DO]: {
        tasks: todo,
        sortedIds: todo.map(({ id }) => id),
      },
      [TaskStatus.IN_PROGRESS]: {
        tasks: inProgress,
        sortedIds: inProgress.map(({ id }) => id),
      },
      [TaskStatus.DONE]: {
        tasks: done,
        sortedIds: done.map(({ id }) => id),
      },
    };
  }, [allTasks]);
  const sortedAllIds = useMemo(
    () => [
      ...filteredTasks.TO_DO.sortedIds,
      ...filteredTasks.IN_PROGRESS.sortedIds,
      ...filteredTasks.DONE.sortedIds,
    ],
    [filteredTasks]
  );

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      sensors={sensors}
    >
      <div className={styles.board}>
        <SortableContext items={sortedAllIds} strategy={verticalListSortingStrategy} key={status}>
          {([TaskStatus.TO_DO, TaskStatus.IN_PROGRESS, TaskStatus.DONE] as TaskStatus[]).map((status) => (
            <Column
              status={status}
              tasks={filteredTasks[status].tasks}
              handleAddNewTask={handleAddNewTask}
              handleDeleteTask={handleDeleteTask}
              activeTaskId={activeTask?.id}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeTask ? <Card task={activeTask} onDelete={handleDeleteTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
