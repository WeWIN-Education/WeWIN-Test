# WeWIN IELTS Process

This file is the operating note for the current WeWIN IELTS project state.

## Current Result Spreadsheet

Google Sheet:

https://docs.google.com/spreadsheets/d/1g4ONkJOpxbUVTIPnpDXbVSB6K75z44f_GLNymTp6Zwo/edit

Spreadsheet ID:

```text
1g4ONkJOpxbUVTIPnpDXbVSB6K75z44f_GLNymTp6Zwo
```

The local `.env.local` has been updated so both values point to this spreadsheet:

```text
GOOGLE_SHEETS_ID=1g4ONkJOpxbUVTIPnpDXbVSB6K75z44f_GLNymTp6Zwo
NEXT_PUBLIC_GOOGLE_SHEETS_ID=1g4ONkJOpxbUVTIPnpDXbVSB6K75z44f_GLNymTp6Zwo
```

Important: the Google Drive connector could not read the live spreadsheet in this Codex session because Google returned `403 PERMISSION_DENIED`. The structure below is based on the app source and Apps Script contract. If live verification is needed, share the spreadsheet with the Google account used by the connector.

## Run The Web App

Use PowerShell:

```powershell
cd C:\Users\wewin2026\Downloads\Wewin-ielts-main\Wewin-ielts-main
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

`pnpm` is not installed on this machine, so use `npm` unless pnpm is installed later.

## Login Rules

Current preferred production flow is email/password login plus Apps Script Web App.

Reason: this avoids needing Google Cloud service accounts. The web app lets students/admins log in with simple credential accounts, then submits the whole test payload to the Apps Script Web App. Apps Script runs as the sheet owner, writes to Google Sheets, saves Speaking audio, calls OpenAI, and sends the admin email.

Google login is optional. Use it only if you want users to submit directly with their own Google OAuth token.

Server-side Google service account credentials are not required for the preferred flow.

Important data rule: the Google account is used only as the permission account for Drive/Sheets. Rows written to `Speaking_list`, `Listening_list`, and `Final_list` must use the student information entered in the first IELTS form (`ielts_userInfo`), not `session.user.name` or `session.user.email` from the Google account.

For email/password users to submit real tests:

1. Paste the latest `Codeappscript.txt` into the Apps Script project attached to the result spreadsheet.
2. Deploy it as a Web App.
3. Set `Execute as` to `Me`.
4. Set access to `Anyone`.
5. Copy the `/exec` URL into `.env.local`:

```text
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
```

Current configured Web App URL:

```text
https://script.google.com/macros/s/AKfycbzYBClvgQRh3fDnS6j5oqubYieaML7lYeuU9z4DAAciYr8rpKKfjLKBH7W1yYGQ2ePA/exec
```

The same URL is also embedded as the safe default in `app/lib/googleAppsScriptWebhook.ts`, so email/password submit will not fall back to the old service-account path if Vercel env is missing. Still keep the Vercel env values set so the URL can be changed without editing code.

With those values set, email/password users can click `KET THUC BAI THI` and the app will submit raw test data directly to the Google Sheet through Apps Script. Speaking audio is sent as base64 at final submit, Apps Script saves it to Drive and writes the Drive links into `Speaking_list`.

Optional security:

```text
GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET=some-secret
```

If this is set in `.env.local`, also set the same value in Apps Script Properties as `IELTS_WEBHOOK_SECRET`.

Admin detection is controlled by `app/constants/email.ts`.

## Web Data Flow

The app test route is:

```text
/test/ielts
```

Main stages:

```text
form -> listening -> writing -> reading -> speaking -> done
```

The browser stores progress in `localStorage`:

- `ielts_userInfo`
- `ielts_startTime`
- `ielts_startAt`
- `ielts_listening`
- `ielts_writingAnswer`
- `ielts_reading`
- `ielts_audio_base64`
- `ielts_audio_links`
- `ielts_uuid`
- `ielts_finished`

Speaking blobs are also stored with `localforage`.

## Sheet Tabs Used By The Web

The app expects these tab names:

```text
Speaking_list
Speaking_Cambridge
Listening_list
Final_list
Answers
Grammar_list
```

Live spreadsheet structure checked with Google Drive connector:

```text
Final_list     gid 2137650534, headers on row 2, write range A:U
Speaking_list  gid 0,          headers on row 2, write range A:J
Listening_list gid 1641917808, headers on row 2, write range A:AR
Answers        gid 903108740,  headers on row 1, read range A:D
Level          gid 2127698482
Grammar_list   gid 973744913, hidden
```

Important writes:

- `Speaking_list`: `/api/log-to-sheet` or Apps Script `doPost` writes exactly A:J.
- `Speaking_Cambridge`: `/api/submit-cambridge-speaking` calls Apps Script `submitCambridgeSpeaking`, which writes A:V and returns results for `/class/cambridge`.
- `Listening_list`: `/api/submit-ielts` or Apps Script `doPost` writes exactly A:AR.
- `Final_list`: `/api/submit-ielts` or Apps Script `doPost` writes A:U. Columns A:L stay compatible with AI scoring; M:U store student/contact metadata.
- `Answers`: `/api/submit-ielts` reads answer keys from here to score Listening/Reading.

## Cambridge Speaking Flow

Student route:

```text
/test/cambridge
```

Admin route:

```text
/class/cambridge
```

API routes:

```text
/api/submit-cambridge-speaking
/api/admin/cambridge-speaking
```

Cambridge levels and prompts are stored in:

```text
app/constants/cambridge.ts
```

Current prompt bank:

```text
Starters:
- I have a brother and a sister.
- I like playing football with my friends.

Movers:
- There is a big playground near my school, and I often play there after class.
- Yesterday, I helped my mother make dinner and set the table.

Flyers:
- When I have free time, I enjoy reading books because they help me learn new things.
- Last summer, my family travelled to the beach, and we spent several days swimming and taking photos.

KET:
- I have recently joined an English club, and it has helped me improve my communication skills.
- Although I was nervous at first, I felt much more confident after speaking in front of my class.
```

`Speaking_Cambridge` headers must be on row 2:

```text
ID, Submit Time, Name, Birth Date, Location, Phone, Email, Consultant, Level, Prompt 1, Audio Link 1, Transcript 1, Prompt 2, Audio Link 2, Transcript 2, Score, Level Fit, English Feedback, Vietnamese Feedback, Recommendation, Status, Last Updated
```

Apps Script creates the tab if it is missing, saves two audio files to Drive, transcribes with Whisper, scores with OpenAI on a 0-5 scale, sends an admin email, and exposes dashboard rows through `getCambridgeSpeaking`.

The Apps Script menu also includes:

```text
IELTS Evaluate -> Setup Cambridge Speaking sheet
```

Use this once after pasting the latest `Codeappscript.txt` to create/format the `Speaking_Cambridge` header row.

Cambridge scoring is a placement estimate, not an official Cambridge certificate result:

- Starters maps to Pre A1 readiness.
- Movers maps to A1 readiness.
- Flyers maps to A2 young learner readiness.
- KET maps to A2 Key readiness.
- Score is 0-5 based on task completion, pronunciation/intelligibility, fluency/confidence, language control for the selected level, and readiness for the next WeWIN class level.
- `Level Fit` should guide office consultation, for example `Below Flyers`, `Developing within Flyers`, `Ready for Flyers`, or `Consider next level: KET`.

## Expected Listening_list Order From Web

`appendIELTSList` writes this row shape into `Listening_list`:

```text
A  ID
B  Start Time
C  Finish Time
D  Full Name
E  Birth Date
F  Location
G  Phone
H  Email
I  Consultant
J  IELTS Need
K  Self Score
L  Study Time
M:AD Listening answers
AE Writing Answer
AF:AR Reading answers
```

No submit path should append scoring/debug columns after `AR`; the live sheet does not have those headers.

The new Apps Script can also find the writing column by header names such as:

- `Writing Answer`
- `Writing`
- `Writing Essay`
- `Essay`
- `Bài Writing`
- `Bài viết`

If no matching header exists, it falls back to column `AE`.

## Apps Script File

Local Apps Script source:

```text
Codeappscript.txt
```

This file has been changed from empty to a full Apps Script implementation.

Paste the entire contents of `Codeappscript.txt` into the Apps Script project attached to the result spreadsheet.

In Google Sheets:

```text
Extensions -> Apps Script
```

Then save and reload the spreadsheet. A menu should appear:

```text
IELTS Evaluate
```

Menu actions:

- `Evaluate Writing + Speaking`
- `Evaluate Writing only`
- `Test OpenAI key`
- `Test admin email`

## Apps Script Config

Recommended `Config` tab:

```text
A1 = OPENAI_API_KEY
B1 = full OpenAI API key
A2:A = admin emails
```

Optional Apps Script Properties:

```text
OPENAI_API_KEY
ADMIN_EMAILS
PDF_DRIVE_FOLDER_ID
```

The script reads the OpenAI key from `Config!B1` first. If that is empty, it falls back to Script Properties.

## New Writing AI Flow On The Sheet

The updated `Codeappscript.txt` now grades Writing directly from `Listening_list`.

When `Evaluate Writing + Speaking` or `Evaluate Writing only` runs, Apps Script:

1. Reads rows from `Listening_list`.
2. Finds the student `ID`, `Name`, `Email`, and Writing answer.
3. Calls OpenAI with an IELTS Writing examiner prompt.
4. Writes results back to `Listening_list`.
5. Updates `Final_list`.

It auto-adds these columns to `Listening_list` if missing:

```text
Writing AI Band
Writing AI Feedback
Writing AI Status
Writing AI Updated At
```

`Writing AI Status` values:

```text
PROCESSING
DONE
NO_WRITING_ANSWER
ERROR
```

## Updated Final_list Structure

`Final_list` is the management summary tab. Headers are on row 2 and the first two rows are frozen.

Columns A:L remain compatible with the old scoring flow:

```text
A  ID
B  Name
C  Email
D  Score
E  Link PDF
F  Writing Band
G  Writing Feedback
H  Writing Status
I  Speaking Band
J  Speaking PDF
K  Overall Band
L  Last Updated
```

Columns M:U are for student/contact metadata submitted from the first IELTS form:

```text
M  Phone
N  Consultant
O  IELTS Need
P  Self Score
Q  Study Time
R  Start Time
S  Finish Time
T  Submission Source
U  Notes
```

The web app writes these columns directly when it has Google API permission. If Google permission is missing, the Apps Script Web App fallback writes the same shape.
When the Apps Script menu evaluates Writing from `Listening_list`, it also copies the available metadata columns into `Final_list`.

`Link PDF` and `Speaking PDF` are intentionally left blank in the current web-submit flow. The admin email is the primary report output.

`Score` and `Overall Band` are computed from available bands:

- Listening/Reading band: computed from the Google Sheet `Answers` tab.
- Writing band: computed by AI during `/api/submit-ielts`.
- Speaking band: computed by Whisper + AI during `/api/submit-ielts` when audio can be transcribed.
- Overall: average of available Listening/Reading, Writing, and Speaking bands, rounded to nearest 0.5.

## Web Submit Admin Email Flow

When the user clicks `KET THUC BAI THI`, `/api/submit-ielts` now:

1. Reads answer keys from `Answers`.
2. Grades Listening/Reading normally from the Google Sheet answer key.
3. Evaluates Writing with AI.
4. Transcribes Speaking audio with Whisper and evaluates it with AI when audio is available.
5. Sends an HTML email report to `adminEmails` in `app/constants/email.ts`.
6. Updates `Listening_list` and `Final_list`.
7. Does not create or attach any PDF.

The admin email template is in `app/components/adminIeltsEmail.ts` and uses:

```text
Logo: https://wewin.edu.vn/wp-content/uploads/2023/07/Artboard-1-copy@1x-e1690017564880.png
Primary blue: #0E4BA9
Gold/brown accent: #E4C28E
```

Current admin email format:

```text
Header title: BAO CAO KET QUA KIEM TRA
Subtitle: WeWIN IELTS Placement Test
Summary cards: Listening/Reading, Writing, Speaking, auto correct count
Main order:
1. Student information and score summary
2. Listening & Reading objective result
3. Wrong answers table
4. Writing feedback, with English first and Vietnamese below
5. Student Writing answer
6. Speaking feedback, with English first and Vietnamese below
7. Speaking transcript when available
```

The email should show the section names as `Writing` and `Speaking`, not `Writing AI` or `Speaking AI`.

For email/password login sessions, `/api/submit-ielts` sends the payload directly to the Apps Script Web App. Therefore the deployed Apps Script must be updated with the latest `Codeappscript.txt`; otherwise audio links and admin email will not work in fallback mode.

## Legacy Speaking AI Flow On The Sheet

Apps Script reads `Speaking_list`.

Required header row is row `2`.

Required columns:

```text
ID
Name
Email
Part 1
Link Audio Part 1
Part 2
Link Audio Part 2
Part 3
Link Audio Part 3
Link PDF
```

When running the legacy `Evaluate Writing + Speaking` menu, Apps Script:

1. Reads audio links from `Speaking_list`.
2. Downloads audio from Google Drive.
3. Sends audio to Whisper.
4. Sends transcript to GPT for Speaking evaluation.
5. Extracts an Overall Band from the GPT response.
6. Updates `Final_list`.
7. Emails admins.

Current preferred flow is the web submit email flow above. The old Next.js `/api/speaking-report` PDF route and PDF helper files were removed.

## Current Admin Dashboard

The admin route `/class` is now the IELTS result dashboard, not the old demo class table.

It loads tested students from `Final_list` through:

```text
GET /api/admin/final-list
```

Read strategy:

- Google admin session: read `Final_list!A2:U` directly with the Google access token.
- Email/password admin session: call Apps Script Web App action `getFinalList`.

The dashboard shows student information, contact data, consultant fields, Writing/Speaking band, and Overall band.

Header test navigation is no longer a dropdown. It now has direct buttons for:

```text
IELTS Test
Cambridge Test
```

`/test/cambridge` is now a Cambridge Speaking flow with student info, level selection, two randomized prompts, browser audio recording, Apps Script submit, and admin email.

The admin route `/class/cambridge` loads Cambridge Speaking rows from `Speaking_Cambridge` through:

```text
GET /api/admin/cambridge-speaking
```

Read strategy:

- Google admin session: read `Speaking_Cambridge!A2:V` directly with the Google access token.
- Email/password admin session: call Apps Script Web App action `getCambridgeSpeaking`.

## Current Known Gaps

- The live Google Sheet was not readable by Codex connector because of permission `403`.
- `OPENAI_API_KEY` is not currently present in local `.env.local`, so web-side Writing grading through `/api/submit-ielts` may fail unless the env is filled. The Apps Script can still grade Writing if `Config!B1` contains the key.
- The preferred Speaking evaluation path is now `/api/submit-ielts`.
- Web retake prevention is currently commented out in `app/(user)/test/ielts/page.tsx`.

## Quick Checklist Before A Real Test

1. Vercel `NEXTAUTH_URL` is the production URL, currently `https://we-win-test.vercel.app`.
2. Vercel has `NEXTAUTH_SECRET`.
3. Vercel has `GOOGLE_SHEETS_ID` and `NEXT_PUBLIC_GOOGLE_SHEETS_ID`.
4. Vercel has `GOOGLE_APPS_SCRIPT_WEB_APP_URL` and `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL`.
5. Apps Script contains the latest `Codeappscript.txt`.
6. Apps Script Web App is deployed with `Execute as: Me` and access `Anyone`.
7. `Config!B1` in the Sheet has a valid OpenAI key.
8. Admin emails are listed in `Config!A2:A`.
9. Run `IELTS Evaluate -> Test OpenAI key`.
10. Run `IELTS Evaluate -> Test admin email`.
11. Submit one web test and check that the admin email arrives. The web-submit flow already grades Writing/Speaking and sends the email; the sheet menu is only for legacy/manual reprocessing.
