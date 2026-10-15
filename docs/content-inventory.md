# Legacy content inventory

Source: main `6d774c7`, inspected 2026-10-15. Full line-by-line text, links, image/alt references, commented markup, asset filenames/sizes/hashes and missing file references are in [legacy-inventory.json](legacy-inventory.json), reproducible with `python3 scripts/inventory-legacy.py`. This ledger covers all 16 HTML files and all 102 assets, including hidden metadata. Migration status is **pending** until Phase 3 maps every item into typed seed/DB/public output. Original files remain intact.

## Sections and mappings

| Source | Existing content | Target / status |
| --- | --- | --- |
| index.html #header | Farzine Hossen; Software Engineer / AI Enthusiast; 8 nav items; LinkedIn/GitHub/email; January 31, 2026 update label | site_settings, navigation/social links; pending |
| #about | Exact biography, profile.png, birthday/phone/city/email, 8 interests | settings/profile facts/interests; sensitive fields private by default; pending |
| #education | 3 education image cards, existing date labels including Present | education; pending, preserve stale labels |
| #education .portfolio | 9 online certifications/competition images, 6 nonempty links | certifications; pending; missing links render without actions |
| #experience | Kite Games Studio; App-concept.com GmbH; SUST ACM Student Chapter; Gaibandha Student Association, SUST | experiences including exact roles/dates/bullets; pending |
| #experience second container | University Innovation Hub; ML Olympiad; DL SPRINT; Bhashamul; hackathons/Codeforces claims | achievements; pending, unverified claims preserved |
| #portfolio | 15 cards, Web/App categories; original order, covers and detail links | projects + stable slugs; pending |
| #skills | Languages and Databases, Frameworks, Tools, CS Fundamentals | skill_groups/skills incl source logos and six text fundamentals; pending |
| #links | Resume and Cover Letter Google Drive links + descriptions | document links; pending |
| #contacts | Address, social profiles, 2 emails, phone | public choices + private profile facts; pending; no form currently |

## Projects (all details inspected)

Keep distinct card titles vs detail titles when they differ. Tech stack, all paragraphs and external links exist verbatim in the JSON source ledger. No new outcomes or metrics. DP-Learning intentionally retains vdg.jpg until owner replaces it.

| Detail source / proposed slug | Original title | External links |
| --- | --- | --- |
| projects/brick.html / `brick` | Brick Changer Game | https://github.com/Farzine/Brick-Changer-Game |
| projects/candle-stick.html / `candle-stick` | Candle Stick | https://github.com/Farzine/candle_stick |
| projects/car.html / `car` | 3D Car Game | https://drive.google.com/file/d/1mmpk6zVzzfXqI4QIMUTt5bzG7AW0BrZU/view?usp=sharing |
| projects/chol-kheli.html / `chol-kheli` | Online Player Auction Website | https://github.com/shaeakh/WebProject |
| projects/dpLearningApp.html / `dplearningapp` | DP-Learning App | https://github.com/Farzine/Design-Pattern-Learning-App |
| projects/effective-learning.html / `effective-learning` | effective-learning | https://effective-learning-nu.vercel.app/login |
| projects/farmAI.html / `farmai` | FarmAI | https://farm-ai-fz.vercel.app/; https://github.com/Farzine/FarmAI |
| projects/golf.html / `golf` | Golf Game with SFML | https://github.com/Farzine/Golf_Game_SFML_GAME |
| projects/gsa-sust.html / `gsa-sust` | Gaibandha Students Association Website | https://www.gsa-sust.org/ |
| projects/icap.html / `icap` | ICAP-2025 | https://icap2025.sust.edu/ |
| projects/icerie.html / `icerie` | ICERIE-2025 | https://icerie2025.sust.edu/ |
| projects/iict.html / `iict` | IICT-SUST | https://iict-sust-swe.vercel.app/ |
| projects/lemonLeafDiseaseDetection.html / `lemonleafdiseasedetection` | Lemon Leaf Disease Detection | https://lemon-leaf-diseases-detection-ai.vercel.app/; https://github.com/Farzine/LemonLeafDiseasesDetectionAI |
| projects/snake.html / `snake` | Console Snake Game | https://github.com/Farzine/first-snake-game-project-semester-1-2 |
| projects/wasteManageMentApp.html / `wastemanagementapp` | Waste Management App | https://github.com/Farzine/waste_management_and_recycle_application |

## External images / skills

These are existing source dependencies; retain provenance and prefer reviewed local copies where licensing permits. User upload SVG/HTML will be rejected; trusted original SVG logos are a separate import decision.

| Alt/name | Source image |
| --- | --- |
| C++ | https://www.vectorlogo.zone/logos/isocpp/isocpp-ar21~bgwhite.svg |
| JavaScript | https://www.vectorlogo.zone/logos/javascript/javascript-ar21.svg |
| Java | https://www.vectorlogo.zone/logos/java/java-ar21.svg |
| TypeScript | https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-ar21.svg |
| Python | https://www.vectorlogo.zone/logos/python/python-horizontal.svg |
| MySQL | https://www.vectorlogo.zone/logos/mysql/mysql-horizontal.svg |
| MongoDB | https://www.vectorlogo.zone/logos/mongodb/mongodb-ar21.svg |
| PostgreSQL | https://www.vectorlogo.zone/logos/postgresql/postgresql-horizontal.svg |
| Supabase | https://www.vectorlogo.zone/logos/supabase/supabase-ar21.svg |
| Next.js | https://www.vectorlogo.zone/logos/nextjs/nextjs-ar21.svg |
| React | https://www.vectorlogo.zone/logos/reactjs/reactjs-ar21.svg |
| Express.js | https://www.vectorlogo.zone/logos/expressjs/expressjs-ar21.svg |
| Tailwind CSS | https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-ar21.svg |
| Node.js | https://www.vectorlogo.zone/logos/nodejs/nodejs-horizontal.svg |
| Flutter | https://www.vectorlogo.zone/logos/flutterio/flutterio-ar21.svg |
| TensorFlow | https://www.vectorlogo.zone/logos/tensorflow/tensorflow-ar21.svg |
| PyTorch | https://www.vectorlogo.zone/logos/pytorch/pytorch-ar21.svg |
| Scikit-learn | https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg |
| Git | https://www.vectorlogo.zone/logos/git-scm/git-scm-ar21.svg |
| Github | https://www.vectorlogo.zone/logos/github/github-ar21.svg |
| Github Copilot | https://www.vectorlogo.zone/logos/github_copilot/github_copilot-ar21.svg |
| Vercel | https://www.vectorlogo.zone/logos/vercel/vercel-ar21.svg |
| Figma | https://www.vectorlogo.zone/logos/figma/figma-ar21.svg |
| Docker | https://www.vectorlogo.zone/logos/docker/docker-ar21.svg |
| ollama | https://raw.githubusercontent.com/cncf/landscape/master/hosted_logos/ollama.svg |
| Hugging Face | https://raw.githubusercontent.com/gilbarbara/logos/main/logos/hugging-face-icon.svg |
| Roboflow | https://cdn.prod.website-files.com/5f6bc60e665f54545a1e52a5/642746dba53a59a614a64b35_roboflow-open-graph.png |
| Jupyter | https://www.vectorlogo.zone/logos/jupyter/jupyter-ar21.svg |
| SSLCommerz | https://sslcommerz.com/wp-content/uploads/2021/11/logo.png |
| Jira | https://www.vectorlogo.zone/logos/atlassian_jira/atlassian_jira-ar21.svg |

## Assets, uncertain content and exclusions

- `assets/img/profile.png` used only in About; 3 education JPGs; 9 certification images; 15 project images; 2 unused background JPGs. Preserve all original files and useful names. See per-asset references/hashes in JSON.
- `favicon.ico` is root icon. All 15 detail pages reference two nonexistent legacy favicon images and a wrongly relative jQuery path: 45 known missing references total. Fix routes/icon imports during migration, do not fabricate replacements.
- `assets/vendor/` supplies Bootstrap 4, icon fonts, jQuery plugins, lightbox and typing; source styles and attribution preserved. Runtime vendor JS replacement is required for React ownership/accessibility, not a redesign.
- Source includes commented Leetcode counter, visitor counter, duplicate nav/template placeholders and unrelated example institution comments. Preserve provenance in ledger but do not publish inactive template/example claims.
- No active testimonials, contact form, proficiency bars or published footer. Do not invent them. Footer may have empty editable settings.
- Date/role/award text is a historical snapshot. In particular internship ending Feb 2026 appears alongside Jan 31 update label; preserve, do not infer chronology.
- Social/contact data was public in original; precise birthday/address/phone remain private in initial migration seed, with editable public flags.
- Source `CNAME` and README hosting instructions are stale hints, not authority to deploy. MIT repo license plus BootstrapMade template attribution require retention.

## Live comparison / baseline evidence

Local and deployed seven section text snapshots match after whitespace/markup normalization. Captures in [reference/](reference/) cover desktop 1440×900 and mobile 390×844. Images loaded, no initial uncaught errors observed. All URLs are inventoried; third-party link reachability is not yet exhaustively audited (phase 8). No source content has been removed or silently revised.

## Phase 2 import mapping

Source importer `scripts/import-legacy.mjs` produced [data/legacy-seed.json](../data/legacy-seed.json) and repeatable [seed.sql](../supabase/seed.sql): 28 media references (profile + 3 education + 9 certificate + 15 project covers), 15 projects with every detail paragraph/tech/link, four experiences, five achievements, 36 skills in four groups, eight interests, seven private profile/contact fact rows, four combined social links, two documents, eight navigation entries, 11 section settings and site identity/biography/SEO/update labels. UUID source provenance stored separately in private schema. Initial education institution fields are blank because cards did not print separate institution names; qualification wording preserved. Existing source logos remain URLs, no invented assets. All project imports draft; collections/private facts invisible until owner review; structural sections/navigation and source public identity/biography/media visible. Public renderer mapping still pending Phase 3.
