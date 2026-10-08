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
  const profile = await requireAdmin();
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

export async function moveRecurringTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("task_id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid task");
  if (direction !== "up" && direction !== "down") {
    throw new Error("Invalid sort direction");
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("recurring_tasks")
    .select("frequency")
    .eq("id", id)
    .single();
  if (taskError) throw taskError;

  const { data: tasks, error } = await supabase
    .from("recurring_tasks")
    .select("id, title, sort_order")
    .eq("frequency", task.frequency)
    .eq("active", true)
    .order("sort_order")
    .order("title");
  if (error) throw error;

  const ordered = [...(tasks ?? [])];
  const currentIndex = ordered.findIndex((item) => item.id === id);
  const targetIndex = currentIndex + (direction === "up" ? -1 : 1);
  if (currentIndex >= 0 && targetIndex >= 0 && targetIndex < ordered.length) {
    [ordered[currentIndex], ordered[targetIndex]] = [
      ordered[targetIndex],
      ordered[currentIndex],
    ];
    const results = await Promise.all(
      ordered.map((item, index) =>
        supabase
          .from("recurring_tasks")
          .update({ sort_order: index + 1 })
          .eq("id", item.id),
      ),
    );
    const updateError = results.find((result) => result.error)?.error;
    if (updateError) throw updateError;
  }
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