-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  gender text check (gender in ('male', 'female', 'other')),
  age integer check (age >= 15 and age <= 100),
  height numeric check (height >= 120 and height <= 250),
  weight numeric check (weight >= 30 and weight <= 300),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text check (goal in ('lose', 'maintain', 'gain')),
  bmr integer,
  tdee integer,
  target_calories integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create meal_entries table
create table meal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  meal_text text not null,
  calories integer not null check (calories >= 0),
  protein numeric not null check (protein >= 0),
  carbs numeric not null check (carbs >= 0),
  fat numeric not null check (fat >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create weight_entries table
create table weight_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  weight numeric not null check (weight >= 30 and weight <= 300),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create achievements table
create table achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text not null,
  icon text not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table meal_entries enable row level security;
alter table weight_entries enable row level security;
alter table achievements enable row level security;

-- Create policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can view own meal entries"
  on meal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal entries"
  on meal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own meal entries"
  on meal_entries for delete
  using (auth.uid() = user_id);

create policy "Users can view own weight entries"
  on weight_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own weight entries"
  on weight_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can view own achievements"
  on achievements for select
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Create function to check and award achievements
create or replace function check_and_award_achievements()
returns trigger as $$
declare
  total_meals integer;
  total_days integer;
  weight_change numeric;
  first_weight numeric;
  latest_weight numeric;
begin
  -- Count total meals logged
  select count(*) into total_meals
  from meal_entries
  where user_id = new.user_id;

  -- Count consecutive days of logging
  select count(distinct date_trunc('day', created_at))
  into total_days
  from meal_entries
  where user_id = new.user_id;

  -- Calculate weight change if applicable
  select weight into first_weight
  from weight_entries
  where user_id = new.user_id
  order by created_at asc
  limit 1;

  select weight into latest_weight
  from weight_entries
  where user_id = new.user_id
  order by created_at desc
  limit 1;

  -- Award achievements based on milestones
  -- First meal logged
  if total_meals = 1 then
    insert into achievements (user_id, title, description, icon)
    values (new.user_id, 'First Meal', 'Logged your first meal!', '🍽️');
  end if;

  -- 10 meals logged
  if total_meals = 10 then
    insert into achievements (user_id, title, description, icon)
    values (new.user_id, 'Getting Started', 'Logged 10 meals!', '📝');
  end if;

  -- 7 days streak
  if total_days = 7 then
    insert into achievements (user_id, title, description, icon)
    values (new.user_id, 'Week Warrior', 'Logged meals for 7 days!', '📅');
  end if;

  -- Weight loss milestone (if applicable)
  if first_weight is not null and latest_weight is not null and
     first_weight > latest_weight and
     (first_weight - latest_weight) >= 5 then
    insert into achievements (user_id, title, description, icon)
    values (new.user_id, 'Weight Loss Champion', 'Lost 5kg!', '⭐');
  end if;

  return new;
end;
$$ language plpgsql;

-- Create triggers for achievement checks
create trigger check_meal_achievements
  after insert on meal_entries
  for each row
  execute function check_and_award_achievements();

create trigger check_weight_achievements
  after insert on weight_entries
  for each row
  execute function check_and_award_achievements(); 