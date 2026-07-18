export type EventRow = {
  id: string;
  title: string;
  event_date: string;
  departure_time: string | null;
  transport_duration: string | null;
  arrival_time: string | null;
  service_start: string | null;
  service_end: string | null;
  departure_end_time: string | null;
  end_time: string | null;
  address: string | null;
  description: string | null;
  guest_count: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  setup: string | null;
  menu: string | null;
  pastry: string | null;
  breakfast: string | null;
  personalization_items: string | null;
  personalization_extra: string | null;
  logistics_flow: string | null;
  status: string;
  created_by: string | null;
};

export type AssignmentRow = {
  event_id: string;
  profile_id: string;
  profiles: { full_name: string } | null;
};

export type AvailabilityRow = {
  id: string;
  profile_id: string;
  date: string;
  status: "beschikbaar" | "niet_beschikbaar";
  note: string | null;
};

export type ChecklistTemplateRow = {
  id: string;
  code: string;
};

export type ChecklistTemplateItemRow = {
  id: string;
  template_id: string;
  section: string | null;
  label: string;
  sort_order: number;
};

export type EventChecklistRow = {
  id: string;
  event_id: string;
  template_id: string;
  status: "open" | "ingediend";
  submitted_by: string | null;
  submitted_at: string | null;
  checklist_templates: ChecklistTemplateRow | null;
  profiles: { full_name: string } | null;
};

export type EventChecklistItemRow = {
  id: string;
  event_checklist_id: string;
  template_item_id: string;
  checked: boolean;
  note: string | null;
  checklist_template_items: ChecklistTemplateItemRow;
};
