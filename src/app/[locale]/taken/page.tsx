import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RecurringTaskList } from "@/components/recurring-task-list";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getNextRecurringTaskDueDate,
  getRecurringTaskPeriodStart,
  type RecurringTaskFrequency,
} from "@/lib/recurring-task-period";
import {
  createRecurringTask,
  deleteRecurringTask,
  setRecurringTaskActive,
  updateRecurringTask,
} from "./actions";

type RecurringTask = {
  id: string;
  title: string;
  frequency: RecurringTaskFrequency;
  schedule_day: number | null;
  active: boolean;
  sort_order: number;
};

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string | string[] }>;
}) {
  const params = await searchParams;
  const sortMode = params.sort === "date" ? "date" : "manual";
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";
  const t = await getTranslations("tasks");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_tasks")
    .select("id, title, frequency, schedule_day, active, sort_order")
    .order("sort_order")
    .order("title");
  const allTasks = (data ?? []) as RecurringTask[];
  const tasks = isAdmin ? allTasks : allTasks.filter((task) => task.active);
  const activeTasks = tasks.filter((task) => task.active);
  const periodsByTask = new Map(
    activeTasks.map((task) => [
      task.id,
      getRecurringTaskPeriodStart(
        task.frequency,
        new Date(),
        task.schedule_day ?? 1,
      ),
    ]),
  );
  const periods = [...new Set(periodsByTask.values())];
  const { data: completions } = periods.length
    ? await supabase
        .from("recurring_task_completions")
        .select("task_id, period_start")
        .in("period_start", periods)
    : { data: [] };
  const completedTasks = new Set(
    (completions ?? []).map((completion) =>
      `${completion.task_id}:${completion.period_start}`,
    ),
  );

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(`${date}T12:00:00`),
    );
  }

  function renderTaskList(frequency: RecurringTaskFrequency) {
    const list = activeTasks
      .filter((task) => task.frequency === frequency)
      .sort((first, second) => {
        if (sortMode === "date") {
          const dueDateDifference = getNextRecurringTaskDueDate(
            frequency,
            first.schedule_day ?? 1,
          ).localeCompare(
            getNextRecurringTaskDueDate(frequency, second.schedule_day ?? 1),
          );
          if (dueDateDifference !== 0) return dueDateDifference;
        }
        return first.sort_order - second.sort_order || first.title.localeCompare(second.title);
      });
    return (
      <RecurringTaskList
        key={`${frequency}-${sortMode}-${list.map((task) => task.id).join(",")}`}
        frequency={frequency}
        sortMode={sortMode}
        canReorder={isAdmin && sortMode === "manual"}
        tasks={list.map((task) => ({
          id: task.id,
          title: task.title,
          frequency,
          completed: completedTasks.has(
            `${task.id}:${periodsByTask.get(task.id)}`,
          ),
          dueDate: formatDate(
            getNextRecurringTaskDueDate(frequency, task.schedule_day ?? 1),
          ),
        }))}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-black/60">{t("shared")}</p>
      </div>

      <nav aria-label={t("sorting")} className="flex gap-4 text-sm">
        <Link
          href={{ pathname: "/taken", query: { sort: "date" } }}
          aria-current={sortMode === "date" ? "page" : undefined}
          className={sortMode === "date" ? "font-medium text-brand" : "text-black/60 hover:text-black"}
        >
          {t("sortByDate")}
        </Link>
        <Link
          href={{ pathname: "/taken", query: { sort: "manual" } }}
          aria-current={sortMode === "manual" ? "page" : undefined}
          className={sortMode === "manual" ? "font-medium text-brand" : "text-black/60 hover:text-black"}
        >
          {t("sortManually")}
        </Link>
      </nav>

      {error && (
        <p role="alert" className="text-sm text-red-700">{t("loadError")}</p>
      )}

      {!error && (
        <div className="grid gap-8 md:grid-cols-3">
          <section>
            <h2 className="mb-2 font-medium">{t("daily")}</h2>
            {renderTaskList("daily")}
          </section>
          <section>
            <h2 className="mb-2 font-medium">{t("weekly")}</h2>
            {renderTaskList("weekly")}
          </section>
          <section>
            <h2 className="mb-2 font-medium">{t("monthly")}</h2>
            {renderTaskList("monthly")}
          </section>
        </div>
      )}

      {isAdmin && (
        <section className="flex flex-col gap-4 border-t border-black/10 pt-6">
          <h2 className="font-medium">{t("manage")}</h2>
          <form action={createRecurringTask} className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
              {t("taskName")}
              <input
                name="title"
                required
                maxLength={200}
                className="rounded border border-black/20 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("frequency")}
              <select
                name="frequency"
                defaultValue="daily"
                className="rounded border border-black/20 bg-white px-3 py-2"
              >
                <option value="daily">{t("daily")}</option>
                <option value="weekly">{t("weekly")}</option>
                <option value="monthly">{t("monthly")}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("scheduleWeekday")}
              <select
                name="schedule_weekday"
                defaultValue="1"
                className="rounded border border-black/20 bg-white px-3 py-2"
              >
                {Array.from({ length: 7 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {t(`weekday${index + 1}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t("scheduleMonthday")}
              <select
                name="schedule_monthday"
                defaultValue="1"
                className="rounded border border-black/20 bg-white px-3 py-2"
              >
                {Array.from({ length: 31 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>{index + 1}</option>
                ))}
              </select>
            </label>
            <p className="w-full text-xs text-black/55">{t("scheduleHelp")}</p>
            <button
              type="submit"
              className="rounded bg-brand px-4 py-2 text-sm text-brand-foreground"
            >
              {t("addTask")}
            </button>
          </form>

          {tasks.length > 0 && (
            <ul className="divide-y divide-black/10">
              {tasks.map((task) => (
                <li key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                  <form action={updateRecurringTask} className="flex min-w-64 flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="task_id" value={task.id} />
                    <input
                      name="title"
                      required
                      maxLength={200}
                      defaultValue={task.title}
                      aria-label={t("taskName")}
                      className="min-w-40 flex-1 rounded border border-black/20 px-3 py-2 text-sm"
                    />
                    <select
                      name="frequency"
                      defaultValue={task.frequency}
                      aria-label={t("frequency")}
                      className="rounded border border-black/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="daily">{t("daily")}</option>
                      <option value="weekly">{t("weekly")}</option>
                      <option value="monthly">{t("monthly")}</option>
                    </select>
                    <select
                      name="schedule_weekday"
                      defaultValue={String(task.frequency === "weekly" ? task.schedule_day ?? 1 : 1)}
                      aria-label={t("scheduleWeekday")}
                      className="rounded border border-black/20 bg-white px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 7 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {t(`weekday${index + 1}`)}
                        </option>
                      ))}
                    </select>
                    <select
                      name="schedule_monthday"
                      defaultValue={String(task.frequency === "monthly" ? task.schedule_day ?? 1 : 1)}
                      aria-label={t("scheduleMonthday")}
                      className="rounded border border-black/20 bg-white px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 31 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>{index + 1}</option>
                      ))}
                    </select>
                    <button type="submit" className="rounded border border-black/20 px-3 py-2 text-sm">
                      {t("save")}
                    </button>
                  </form>
                  <form action={setRecurringTaskActive}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <button
                      type="submit"
                      name="active"
                      value={String(!task.active)}
                      className="text-sm text-brand underline underline-offset-2"
                    >
                      {task.active ? t("deactivate") : t("activate")}
                    </button>
                  </form>
                  <form action={deleteRecurringTask}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <button type="submit" className="text-sm text-red-700 underline underline-offset-2">
                      {t("delete")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}