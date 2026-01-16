select
  posts.id as post_id,
  posts.title as post_title,
  users.name as user_name,
  users.email as user_email
from posts
join users on users.id = posts.userId
order by posts.id;
