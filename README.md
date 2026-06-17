# WeWIN IELTS

Next.js app for IELTS placement tests. The web app collects Listening, Reading, Writing, and Speaking answers, writes results to Google Sheets through Google OAuth or Apps Script fallback, and sends an admin email report.

## Requirements

- Node.js 18+
- npm
- Google Cloud OAuth credentials, if Google login is used
- Google Sheet Apps Script Web App, if email/password login is used for real submissions
- OpenAI API key for Writing/Speaking AI evaluation

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

See `.env.example`. Do not commit `.env.local`.

| Variable | Description |
| --- | --- |
| `NEXTAUTH_URL` | App URL, for example `http://localhost:3000` locally |
| `NEXTAUTH_SECRET` | Random string for session encryption |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GOOGLE_SHEETS_ID` / `NEXT_PUBLIC_GOOGLE_SHEETS_ID` | Result spreadsheet ID |
| `GOOGLE_DRIVE_SPEAKING_FOLDER_ID` / `NEXT_PUBLIC_GOOGLE_DRIVE_SPEAKING_FOLDER_ID` | Drive folder for speaking audio |
| `OPENAI_API_KEY` | OpenAI key for AI evaluation |
| `GOOGLE_APPS_SCRIPT_WEB_APP_URL` / `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL` | Apps Script `/exec` URL for email/password submit fallback |
| `GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET` | Optional shared secret with Apps Script |
| `CREDENTIAL_USERS_JSON` | Optional JSON array of credential login users |

## Credential Login

Default demo accounts are defined in `app/lib/users.ts`:

```text
admin@wewin.edu.vn / Wewin@2026!
user@wewin.edu.vn  / Wewin@2026!
```

For production, use stronger passwords and set `CREDENTIAL_USERS_JSON` in Vercel instead of changing code:

```json
[
  {
    "id": "admin-1",
    "email": "admin@wewin.edu.vn",
    "name": "WeWIN Admin",
    "passwordHash": "$2b$10$...",
    "role": "admin"
  },
  {
    "id": "user-1",
    "email": "user@wewin.edu.vn",
    "name": "WeWIN Student",
    "passwordHash": "$2b$10$...",
    "role": "user"
  }
]
```

Generate a bcrypt password hash:

```bash
node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"
```

## Deploy With GitHub + Vercel

This app uses Next.js API routes, authentication, Gmail, Sheets, and OpenAI calls. GitHub Pages is not enough for this app. Use GitHub to store the code and Vercel to run the app.

Push the project to GitHub:

```bash
git init
git add .
git commit -m "Initial WeWIN IELTS app"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin main
```

Deploy on Vercel:

1. Go to Vercel and choose `Add New -> Project`.
2. Import the GitHub repository.
3. Framework preset: `Next.js`.
4. Install command: `npm install`.
5. Build command: `npm run build`.
6. Add all required environment variables from `.env.local`.
7. Deploy.

After Vercel gives a production URL, update:

```text
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

If Google login is used, add this authorized redirect URI in Google Cloud:

```text
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

## Google Apps Script

Copy code from `Codeappscript.txt` into `Extensions -> Apps Script` on the Google Sheet.

Recommended Apps Script config:

```text
Config!B1 = OPENAI_API_KEY
Config!A2:A = admin emails
```

Deploy Apps Script as a Web App, copy the `/exec` URL, and set it in:

```text
GOOGLE_APPS_SCRIPT_WEB_APP_URL
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # run production server
npm run lint     # ESLint
```
