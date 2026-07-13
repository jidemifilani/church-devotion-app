-- Sample content so the app has something to show right after setup.
-- Run after 0001_init.sql. Replace with real church content whenever you like.

insert into public.devotions (devotion_date, title, scripture_reference, scripture_text, body, author)
values
  (current_date, 'Walking in Faith', 'Hebrews 11:1',
   'Now faith is confidence in what we hope for and assurance about what we do not see.',
   'Faith is not the absence of doubt, but the decision to trust God in spite of it. Today, whatever you are facing, remember that God is faithful to His promises even when the outcome isn''t visible yet.',
   'Pastor John'),
  (current_date - 1, 'His Mercies Are New', 'Lamentations 3:22-23',
   'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
   'No matter how yesterday went, God''s mercy meets you fresh today. Let go of the guilt and receive His grace for a new start.',
   'Pastor John');

insert into public.hymns (number, title, lyrics, author, category)
values
  (1, 'Amazing Grace',
   E'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.',
   'John Newton', 'Classic Hymns'),
  (2, 'How Great Thou Art',
   E'O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made,\nI see the stars, I hear the rolling thunder,\nThy power throughout the universe displayed.',
   'Carl Boberg', 'Classic Hymns');
