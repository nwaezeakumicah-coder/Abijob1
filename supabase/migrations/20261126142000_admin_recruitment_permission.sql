insert into public.admin_permissions(role,permission_key,description)
values ('super_admin','recruitment.view','View recruitment, interview and employment metrics'),
       ('admin','recruitment.view','View recruitment, interview and employment metrics')
on conflict (role,permission_key) do nothing;