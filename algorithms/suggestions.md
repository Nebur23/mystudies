



"Find students who share something meaningful with you — same school, same region, or same subjects — and rank those with the most in common first."



given: currentUser (school, region, subjects[])

candidates = all public students WHERE userId != currentUser.userId
             AND (
               school == currentUser.school        -- same school
               OR region == currentUser.region      -- same region  
               OR subjects overlaps currentUser.subjects  -- any shared subject
             )

for each candidate:
  score = 0
  if candidate.school == currentUser.school  → score += 3  (strongest signal)
  if candidate.region == currentUser.region  → score += 2
  if candidate.subjects ∩ currentUser.subjects != ∅ → score += 1

sort by score DESC
take top 12
label each with matchReason = highest matching criterion



## SQL

```sql

SELECT *, 
  (CASE WHEN school = 'GHS Kambo' THEN 3 ELSE 0 END +
   CASE WHEN region = 'centre'    THEN 2 ELSE 0 END +
   CASE WHEN subjects && '["Math","Biology"]' THEN 1 ELSE 0 END
  ) AS score,
  CASE 
    WHEN school = 'GHS Kambo' THEN 'same_school'
    WHEN region = 'centre'    THEN 'same_region'
    WHEN subjects && '["Math","Biology"]' THEN 'same_subject'
  END AS matchReason
FROM student_profile
WHERE is_public = true
  AND user_id != $currentUserId
  AND (school = 'GHS Kambo' OR region = 'centre' OR subjects && '["Math","Biology"]')
ORDER BY score DESC
LIMIT 12

```

The key difference from before: instead of a priority-only CASE 1/2/3, we use additive scoring so a student who shares both school AND region ranks higher than one who only shares region.