alter table public.pose_events
drop constraint if exists pose_events_event_type_check;

alter table public.pose_events
add constraint pose_events_event_type_check
check (
  event_type in (
    'session_started',
    'calibration_completed',
    'rep_completed',
    'feedback_given',
    'low_confidence',
    'pain_reported',
    'session_completed'
  )
);
