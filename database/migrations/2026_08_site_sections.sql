-- Aligne les clés de sections sur les sections réellement présentes dans Home.jsx
UPDATE app_settings
SET `value` = '{"hero":true,"calendar":true,"upcoming":true,"services":true,"reviews":true,"cta":true}'
WHERE `key` = 'home_sections';