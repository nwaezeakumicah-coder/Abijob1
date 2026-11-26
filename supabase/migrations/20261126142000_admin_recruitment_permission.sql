insert into public.admin_permissions(role,permission_key)
values ('super_admin','recruitment.view'),('admin','recruitment.view')
on conflict (role,permission_key) do nothing;