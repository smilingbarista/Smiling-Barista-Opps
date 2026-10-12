alter table recurring_tasks
  drop constraint recurring_tasks_frequency_check;

alter table recurring_tasks
  add constraint recurring_tasks_frequency_check
  check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

alter table recurring_tasks
  add column schedule_month smallint;

alter table recurring_tasks
  drop constraint recurring_tasks_schedule_day_check;

alter table recurring_tasks
  add constraint recurring_tasks_schedule_day_check
  check (
    (frequency = 'daily' and schedule_day is null)
    or (frequency = 'weekly' and schedule_day between 1 and 7)
    or (frequency in ('monthly', 'quarterly', 'yearly') and schedule_day between 1 and 31)
  );

alter table recurring_tasks
  add constraint recurring_tasks_schedule_month_check
  check (
    (frequency in ('daily', 'weekly', 'monthly') and schedule_month is null)
    or (frequency = 'quarterly' and schedule_month between 1 and 3)
    or (frequency = 'yearly' and schedule_month between 1 and 12)
  );
