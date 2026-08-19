# System Architecture

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Backend**: Google Apps Script (Google Sheets as database)
- **Media Storage**: Cloudinary (images/videos)
- **Auth**: Phone + OTP (toast) → Password (stored in Sheets)
- **Hosting**: Static files (GitHub Pages / any static host)

## Core Files
```
├── index.html          # Main app (home, chat, gallery, auth)
├── gallery.html        # Standalone gallery page
├── admin.html          # Admin dashboard (CRUD users/messages/reports)
├── profile.html        # User profile (edit name, change password)
├── edukasi.html        # Education categories
├── tools.html          # Tools categories
├── apps-script.gs      # Google Apps Script backend
├── DESIGN.md           # Design system (Pinterest Indonesia tokens)
└── config.js           # API endpoints (optional)
```

## Data Model (Google Sheets Tabs)

| Tab | Columns |
|-----|---------|
| **Users** | ID, Phone, Password, Name, Status, Joined |
| **Messages** | ID, Sender, Message, Time, Status |
| **Reports** | ID, Reporter, Reason, Date, Status |
| **Gallery** | ID, URL, Title, Uploader, Date, Likes |
| **Settings** | Key, Value |

## Cloudinary Config
- Cloud Name: `duknzwtx2`
- Upload Preset: `gallery_upload` (unsigned)
- List API: `https://res.cloudinary.com/duknzwtx2/<type>/list/gallery.json`
- Tag all uploads with `gallery` to appear in list