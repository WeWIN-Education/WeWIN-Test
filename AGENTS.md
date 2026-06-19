# WeWIN IELTS Project Memory

- Main production flow: email/password login plus Google Apps Script Web App.
- Google OAuth code may stay in the backend, but the login UI should not render Google login unless the project owner asks to re-enable it.
- Main spreadsheet ID: `1g4ONkJOpxbUVTIPnpDXbVSB6K75z44f_GLNymTp6Zwo`.
- Current Apps Script Web App URL: `https://script.google.com/macros/s/AKfycbzYBClvgQRh3fDnS6j5oqubYieaML7lYeuU9z4DAAciYr8rpKKfjLKBH7W1yYGQ2ePA/exec`.
- IELTS admin results read from `Final_list`.
- Cambridge admin results read from `Speaking_Cambridge`.
- Cambridge scoring is a placement estimate, not an official Cambridge certificate score.
- Cambridge level mapping: Starters = Pre A1, Movers = A1, Flyers = A2, KET = A2 Key.
- Cambridge score is 0-5 and should guide office/parent consultation, with `Level Fit` and recommendation more important than the number alone.
- Do not add a PDF report requirement for the Cambridge speaking flow.
- Do not require a Google service account for the preferred flow.
- Apps Script handles Drive audio saves, Whisper transcription, OpenAI scoring, Sheet writes, and admin emails.
