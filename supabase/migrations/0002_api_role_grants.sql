grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.workout_sessions to service_role;
grant select, insert, update, delete on public.pose_events to service_role;
grant select, insert, update, delete on public.coach_reviews to service_role;
grant select, insert, update, delete on public.image_sessions to service_role;
grant select, insert, update, delete on public.meal_reviews to service_role;

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.workout_sessions to authenticated;
grant select on public.pose_events to authenticated;
grant select on public.coach_reviews to authenticated;
grant select on public.image_sessions to authenticated;
grant select on public.meal_reviews to authenticated;
