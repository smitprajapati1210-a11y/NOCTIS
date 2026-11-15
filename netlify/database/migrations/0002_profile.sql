alter table "user"
  add column if not exists "profileName" text,
  add column if not exists "profilePhoto" text,
  add column if not exists "phoneNumber" text;
