-- DineEasy auth cleanup
-- Run manually in Supabase SQL Editor (production: review rows before DELETE).

-- 1) Detect duplicate emails (case-insensitive) in auth.users
SELECT
  lower(email) AS normalized_email,
  COUNT(*) AS account_count,
  ARRAY_AGG(id ORDER BY created_at ASC) AS user_ids
FROM auth.users
WHERE email IS NOT NULL
GROUP BY lower(email)
HAVING COUNT(*) > 1;

-- 2) Keep the oldest account per email and delete newer duplicates
-- Uncomment only after you verify the SELECT output above.
/*
WITH ranked AS (
  SELECT
    id,
    email,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY lower(email)
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM auth.users
  WHERE email IS NOT NULL
)
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);
*/

-- 3) Verify uniqueness after cleanup
SELECT
  lower(email) AS normalized_email,
  COUNT(*) AS account_count
FROM auth.users
WHERE email IS NOT NULL
GROUP BY lower(email)
HAVING COUNT(*) > 1;
