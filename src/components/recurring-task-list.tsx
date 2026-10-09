"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  reorderRecurringTasks,
  setRecurringTaskCompletion,
} from "@/app/[locale]/taken/actions";
import type { RecurringTaskFrequency } from "@/lib/recurring-task-period";

export type RecurringTaskListItem = {
  id: string;
  title: string;
  frequency: RecurringTaskFrequency;
  completed: boolean;
  dueDate: string;
};

export function RecurringTaskList({
  frequency,
  tasks,
  sortMode,
  canReorder,
}: {
  frequency: RecurringTaskFrequency;
  tasks: RecurringTaskListItem[];
  sortMode: "date" | "manual";
  canReorder: boolean;
}) {
  const t = useTranslations("tasks");
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function dropTask(targetTaskId: string) {
    if (!draggedTaskId || draggedTaskId === targetTaskId || isPending) return;
    const nextTasks = [...orderedTasks];
    const sourceIndex = nextTasks.findIndex((task) => task.id === draggedTaskId);
    const targetIndex = nextTasks.findIndex((task) => task.id === targetTaskId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedTask] = nextTasks.splice(sourceIndex, 1);
    nextTasks.splice(targetIndex, 0, movedTask);
    const taskIds = nextTasks.map((task) => task.id);
    setOrderedTasks(nextTasks);
    setDraggedTaskId(null);
    setSaveError(false);

    startTransition(async () => {
      try {
        await reorderRecurringTasks(frequency, taskIds);
      } catch {
        setOrderedTasks(tasks);
        setSaveError(true);
      }
    });
  }

  if (orderedTasks.length === 0) {
    return <p className="text-sm text-black/50">{t("noTasks")}</p>;
  }

  return (
    <div aria-busy={isPending}>
      {saveError && (
        <p role="alert" className="mb-2 text-sm text-red-700">
          {t("reorderError")}
        </p>
      )}
      <ul className="divide-y divide-black/10">
        {orderedTasks.map((task) => (
          <li
            key={task.id}
            onDragOver={(event) => {
              if (canReorder) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (canReorder) dropTask(task.id);
            }}
            className={`flex items-center gap-3 py-3 ${
              draggedTaskId === task.id ? "opacity-40" : ""
            }`}
          >
            {canReorder && (
              <button
                type="button"
                draggable={!isPending}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDraggedTaskId(task.id);
                }}
                onDragEnd={() => setDraggedTaskId(null)}
                aria-label={t("dragTask")}
                title={t("dragTask")}
                className="cursor-grab touch-none text-lg leading-none text-black/45 active:cursor-grabbing"
              >
                ⋮⋮
              </button>
            )}
            <form action={setRecurringTaskCompletion} className="flex min-w-0 flex-1">
              <input type="hidden" name="task_id" value={task.id} />
              <input type="hidden" name="frequency" value={frequency} />
              <button
                type="submit"
                name="completed"
                value={String(!task.completed)}
                aria-pressed={task.completed}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-5 shrink-0 place-items-center rounded border ${
                    task.completed
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-black/30 bg-white"
                  }`}
                >
                  {task.completed ? "✓" : ""}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={task.completed ? "text-black/45 line-through" : ""}>
                    {task.title}
                  </span>
                  {sortMode === "date" && (
                    <span className="text-xs text-black/50">{task.dueDate}</span>
                  )}
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}