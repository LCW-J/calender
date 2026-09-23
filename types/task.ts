export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
}

export type NewTaskInput = Omit<TaskItem, "id" | "completed"> & { completed?: boolean };
