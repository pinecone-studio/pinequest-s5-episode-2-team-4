-- LevelUp: group battles take up to 8 players (was 5). Lobbies already open
-- keep their size; class battles set their own (100). Run after 0006.
alter table public.battles alter column max_players set default 8;
