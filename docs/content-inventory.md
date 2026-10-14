# Legacy content inventory

Generated with `python3 scripts/inventory.py`. See [machine-readable inventory](../data/legacy-inventory.json) for every section text, link, image reference, asset size, usage, and source hash.

## Provenance and migration rules

- Checked-out commit is authoritative for seed wording; deployed content is a comparison source.
- No dates, claims, roles, or metrics are refreshed. Preserve the literal date text, including Present.
- Imported records remain drafts until the owner reviews and publishes them.
- Birthday, phone, detailed address, and student email remain private. Publish personal fields only through explicit visibility controls.
- Three certificate links are empty; omit the link control rather than invent a credential URL.
- DP-Learning App uses vdg.jpg. Preserve this mapping pending owner review.
- All 15 project HTML pages include descriptions and technologies; no project is dropped.
- Legacy analytics, hidden visitor counter, typing effect, loader, vendor libraries, and DS_Store files are preserved in legacy source but excluded from the new public application.

## Section mapping

| Source                | Content                                                                   | Target                                  | State                                      |
| --------------------- | ------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| index.html#header     | Name, Software Engineer / AI Enthusiast, social links, last-updated label | site_settings, social_links             | draft imported; public display implemented |
| index.html#about      | Biography, portrait, eight interests, private facts                       | site_settings, interests, profile_facts | draft imported; public display implemented |
| index.html#education  | Three education entries and nine certificates                             | education, certifications               | draft imported; public display implemented |
| index.html#experience | Four roles and five competition/achievement entries                       | experiences, achievements               | draft imported; public display implemented |
| index.html#portfolio  | 15 project cards; Web/App categories and covers                           | projects                                | draft imported; public display implemented |
| index.html#skills     | Four skill groups (image alt labels and fundamentals)                     | skill_groups, skills                    | draft imported; public display implemented |
| index.html#links      | Resume and cover-letter Drive links                                       | navigation_items                        | draft imported; public display implemented |
| index.html#contacts   | Three social profiles, contact fields                                     | social_links, profile_facts             | draft imported; public display implemented |

## Project sources

| Source                                  | Title                                             | Cover                                     | State                                      |
| --------------------------------------- | ------------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| projects/brick.html                     | Brick Changer Game                                | assets/img/project/brick.png              | draft imported; public display implemented |
| projects/candle-stick.html              | Candle Stick                                      | assets/img/project/candle-stick.png       | draft imported; public display implemented |
| projects/car.html                       | 3D Car Game                                       | assets/img/project/car.png                | draft imported; public display implemented |
| projects/chol-kheli.html                | Chol-Kheli                                        | assets/img/project/chol-kheli.png         | draft imported; public display implemented |
| projects/dpLearningApp.html             | DP-Learning App                                   | assets/img/project/vdg.jpg                | draft imported; public display implemented |
| projects/effective-learning.html        | Effective-learning through improved prompt design | assets/img/project/effective-learning.png | draft imported; public display implemented |
| projects/farmAI.html                    | FarmAI                                            | assets/img/project/farmAI.png             | draft imported; public display implemented |
| projects/golf.html                      | Golf Game with SFML                               | assets/img/project/golf.png               | draft imported; public display implemented |
| projects/gsa-sust.html                  | Gaibandha Students Association Website            | assets/img/project/gsa-sust.png           | draft imported; public display implemented |
| projects/icap.html                      | ICAP-2025                                         | assets/img/project/icap.png               | draft imported; public display implemented |
| projects/icerie.html                    | ICERIE-2025                                       | assets/img/project/icerie.png             | draft imported; public display implemented |
| projects/iict.html                      | IICT-SUST                                         | assets/img/project/iict.png               | draft imported; public display implemented |
| projects/lemonLeafDiseaseDetection.html | Lemon Leaf Disease Detection                      | assets/img/project/lemon.png              | draft imported; public display implemented |
| projects/snake.html                     | Console Snake Game                                | assets/img/project/snake.png              | draft imported; public display implemented |
| projects/wasteManageMentApp.html        | Waste Management App                              | assets/img/project/waste.png              | draft imported; public display implemented |

## Assets and known legacy issues

There are 102 asset files (22,189,651 bytes), including vendored libraries. Original files remain untouched. Education images and all certificate images are mapped in the JSON inventory. Two background images have no HTML usage and remain available for review.

Legacy project pages reference missing favicon/apple-touch icons and a misrelative jQuery script. The homepage includes external skill-logo hosts and analytics scripts. The new app will use text skill labels, optimized local images, and no copied tracking code.

## Deployed comparison

The deployed page was reachable through the web tool. Visible section names, project list, experience dates and skill groups match the checked-out content. Full HTML/hash comparison is recorded in CONTEXT.md once HTTP retrieval completes. External link reachability remains a Phase 8 check; inventory presence is not a claim that third-party links work.

## Draft import completed (Phase 2)

`npm run seed:generate` reads the legacy HTML, creates deterministic draft records in `data/portfolio-seed.json` and non-overwriting `supabase/seed.sql`. `data/seed-provenance.json` maps every imported entity to its source. Imported: 15 projects, four roles, three education entries, nine certificates, five achievements, four skill groups/36 skills, eight interests, three social links, seven navigation/document links, ten section settings, one identity/settings row and eight private facts. All content defaults to draft, with no factual changes. Public display migration remains Phase 3. Original last-updated text is retained but hidden by default.

## Public display mapping completed (Phase 3)

Hero/profile, about, projects, experience, skills, education, certifications, competitions/achievements, interests, resume/cover letter, social/contact and footer now render from explicit public DAL DTOs. Visibility and section order come from section settings. All 15 projects have stable detail slugs and legacy redirects. No invented outcomes, testimonials, skill ratings, employers or new metrics were added. Empty credential links render no control. Phone, birthday, address and emails remain private in the seed; social links provide the preview's contact options. Optional legacy last-updated text is editable but hidden by default.

Publication is intentionally not performed by the migration: all DB seed rows remain drafts. The explicitly enabled development preview renders these preserved records without changing them. Legacy tracking, hidden visitor counter, loader and vendor animation are excluded from Next execution; original files remain intact. Copied macOS metadata was excluded from public assets.
