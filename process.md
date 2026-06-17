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

Use Google login for real tests.

Reason: the test submission flow needs a Google OAuth `accessToken` to:

- upload Speaking audio to Google Drive
- write rows into Google Sheets
- send email through Gmail, if that flow is enabled

Credentials login exists for demo/admin access. Credentials sessions do not have a personal Google access token, so real submission needs either:

- Google login with an account that has Editor access, or
- server-side service account credentials in `.env.local`.
- the Google Sheet Apps Script deployed as a Web App.

Important data rule: the Google account is used only as the permission account for Drive/Sheets. Rows written to `Speaking_list`, `Listening_list`, and `Final_list` must use the student information entered in the first IELTS form (`ielts_userInfo`), not `session.user.name` or `session.user.email` from the Google account.

For email/password users to submit real tests, configure:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then share both the result spreadsheet and the Speaking Drive folder with the service account email as Editor.

Simpler direct-submit option:

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
- `Listening_list`: `/api/submit-ielts` or Apps Script `doPost` writes exactly A:AR.
- `Final_list`: `/api/submit-ielts` or Apps Script `doPost` writes A:U. Columns A:L stay compatible with AI scoring; M:U store student/contact metadata.
- `Answers`: `/api/submit-ielts` reads answer keys from here to score Listening/Reading.

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

`/test/cambridge` is currently a placeholder page for the upcoming Cambridge test flow.

## Current Known Gaps

- The live Google Sheet was not readable by Codex connector because of permission `403`.
- `OPENAI_API_KEY` is not currently present in local `.env.local`, so web-side Writing grading through `/api/submit-ielts` may fail unless the env is filled. The Apps Script can still grade Writing if `Config!B1` contains the key.
- The preferred Speaking evaluation path is now `/api/submit-ielts`.
- Web retake prevention is currently commented out in `app/(user)/test/ielts/page.tsx`.

## Quick Checklist Before A Real Test

1. `.env.local` points to the correct spreadsheet ID.
2. Google login works.
3. Google account has Editor access to the result spreadsheet.
4. Google account has access to the Speaking Drive folder.
5. `Config!B1` in the Sheet has a valid OpenAI key.
6. Admin emails are listed in `Config!A2:A`.
7. Apps Script contains the latest `Codeappscript.txt`.
8. Run `IELTS Evaluate -> Test OpenAI key`.
9. Run `IELTS Evaluate -> Test admin email`.
10. Submit one web test and check that the admin email arrives. The web-submit flow already grades Writing/Speaking and sends the email; the sheet menu is only for legacy/manual reprocessing.
