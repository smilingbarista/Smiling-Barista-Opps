"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { getRecurringTaskPeriodStart } from "@/lib/recurring-task-period";
import { createClient } from "@/lib/supabase/server";

function getSchedule(frequency: string, formData: FormData) {
  if (frequency === "daily") return { frequency, schedule_day: null };
  if (frequency === "weekly") {
    const day = Number(formData.get("schedule_weekday"));
    if (!Number.isInteger(day) || day < 1 || day > 7) {
      throw new Error("Choose a weekday for the task");
    }
    return { frequency, schedule_day: day };
  }
  if (frequency === "monthly") {
    const day = Number(formData.get("schedule_monthday"));
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new Error("Choose a day of the month for the task");
    }
    return { frequency, schedule_day: day };
  }
  throw new Error("Choose a valid task frequency");
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Only admins can manage tasks");
  return profile;
}

async function refreshTasks() {
  const locale = await getLocale();
  revalidatePath(`/${locale}/taken`);
}

export async function createRecurringTask(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  const title = String(formData.get("title") ?? "").trim();
  const schedule = getSchedule(String(formData.get("frequency") ?? ""), formData);
  if (!title || title.length > 200) throw new Error("Enter a valid task name");

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_tasks").insert({
    title,
    ...schedule,
    created_by: profile.id,
  });
  if (error) throw error;
  await refreshTasks();
}

export async function updateRecurringTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("task_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const schedule = getSchedule(String(formData.get("frequency") ?? ""), formData);
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid task");
  if (!title || title.length > 200) throw new Error("Enter a valid task name");

  const supabase = await createClient();
  const { data: currentTask, error: currentTaskError } = await supabase
    .from("recurring_tasks")
    .select("frequency, schedule_day")
    .eq("id", id)
    .single();
  if (currentTaskError) throw currentTaskError;

  if (
    currentTask.frequency !== schedule.frequency ||
    currentTask.schedule_day !== schedule.schedule_day
  ) {
    const { error } = await supabase
      .from("recurring_task_completions")
      .delete()
      .eq("task_id", id);
    if (error) throw error;
  }

  const { error } = await supabase
    .from("recurring_tasks")
    .update({
      title,
      ...schedule,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  await refreshTasks();
}

export async function setRecurringTaskActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("task_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid task");

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_tasks")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  await refreshTasks();
}

export async function deleteRecurringTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("task_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid task");

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_tasks").delete().eq("id", id);
  if (error) throw error;
  await refreshTasks();
}

export async function reorderRecurringTasks(
  frequency: string,
  taskIds: string[],
) {
  await requireAdmin();
  if (frequency !== "daily" && frequency !== "weekly" && frequency !== "monthly") {
    throw new Error("Invalid task frequency");
  }
  if (
    taskIds.length > 500 ||
    new Set(taskIds).size !== taskIds.length ||
    taskIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id))
  ) {
    throw new Error("Invalid task order");
  }

  const supabase = await createClient();
  const { data: tasks, error } = await supabase
    .from("recurring_tasks")
    .select("id")
    .eq("frequency", frequency)
    .eq("active", true);
  if (error) throw error;
  if (
    !tasks ||
    tasks.length !== taskIds.length ||
    tasks.some((task) => !taskIds.includes(task.id))
  ) {
    throw new Error("Task list changed; refresh and try again");
  }

  const results = await Promise.all(
    taskIds.map((id, index) =>
      supabase
        .from("recurring_tasks")
        .update({ sort_order: index + 1 })
        .eq("id", id)
        .eq("frequency", frequency)
        .eq("active", true),
    ),
  );
  const failedUpdate = results.find((result) => result.error);
  if (failedUpdate?.error) throw failedUpdate.error;
  await refreshTasks();
}

export async function setRecurringTaskCompletion(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const taskId = String(formData.get("task_id") ?? "");
  const frequency = String(formData.get("frequency") ?? "");
  const completed = String(formData.get("completed") ?? "") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(taskId)) throw new Error("Invalid task");
  if (frequency !== "daily" && frequency !== "weekly" && frequency !== "monthly") {
    throw new Error("Invalid task frequency");
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("recurring_tasks")
    .select("frequency, schedule_day")
    .eq("id", taskId)
    .eq("active", true)
    .single();
  if (taskError) throw taskError;
  if (task.frequency !== frequency) throw new Error("Task frequency changed");
  const periodStart = getRecurringTaskPeriodStart(
    frequency,
    new Date(),
    task.schedule_day ?? 1,
  );
  if (completed) {
    const { error } = await supabase.from("recurring_task_completions").upsert(
      {
        task_id: taskId,
        period_start: periodStart,
        completed_by: profile.id,
      },
      { onConflict: "task_id,period_start" },
    );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("recurring_task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("period_start", periodStart);
    if (error) throw error;
  }

  await refreshTasks();
}