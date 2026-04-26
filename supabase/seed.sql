insert into public.challenges (slug, title, difficulty, description, starter_code, test_cases)
values
  (
    'two-sum',
    'Two Sum',
    'EASY',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    '{"typescript":"function twoSum(nums: number[], target: number): number[] {\n  return [];\n}"}'::jsonb,
    '[{"input":{"nums":[2,7,11,15],"target":9},"output":[0,1]},{"input":{"nums":[3,2,4],"target":6},"output":[1,2]}]'::jsonb
  ),
  (
    'longest-substring-without-repeating-characters',
    'Longest Substring Without Repeating Characters',
    'MEDIUM',
    'Given a string s, find the length of the longest substring without repeating characters.',
    '{"typescript":"function lengthOfLongestSubstring(s: string): number {\n  return 0;\n}"}'::jsonb,
    '[{"input":"abcabcbb","output":3},{"input":"bbbbb","output":1},{"input":"pwwkew","output":3}]'::jsonb
  ),
  (
    'merge-k-sorted-lists',
    'Merge K Sorted Lists',
    'HARD',
    'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all lists into one sorted linked-list and return it.',
    '{"typescript":"function mergeKLists(lists: number[][]): number[] {\n  return [];\n}"}'::jsonb,
    '[{"input":[[1,4,5],[1,3,4],[2,6]],"output":[1,1,2,3,4,4,5,6]},{"input":[],"output":[]}]'::jsonb
  )
on conflict (slug) do update
set
  title = excluded.title,
  difficulty = excluded.difficulty,
  description = excluded.description,
  starter_code = excluded.starter_code,
  test_cases = excluded.test_cases,
  updated_at = now();
