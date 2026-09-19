select a.user_id, u.email
from public.admins a
join auth.users u on u.id = a.user_id;