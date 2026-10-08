alter table recurring_tasks
  drop constraint recurring_tasks_frequency_check;

alter table recurring_tasks
  add constraint recurring_tasks_frequency_check
  check (frequency in ('daily', 'weekly', 'monthly'));

alter table recurring_tasks add column schedule_day smallint;
update recurring_tasks set schedule_day = 1 where frequency = 'weekly';

alter table recurring_tasks
  add constraint recurring_tasks_schedule_day_check
  check (
    (frequency = 'daily' and schedule_day is null)
    or (frequency = 'weekly' and schedule_day between 1 and 7)
    or (frequency = 'monthly' and schedule_day between 1 and 31)
  );