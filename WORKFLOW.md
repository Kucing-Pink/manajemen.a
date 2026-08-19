# Development Workflow

## Setup (First Time)
1. **Google Sheet**: Buat sheet → tab Users/Messages/Reports/Gallery/Settings dengan header
2. **Apps Script**: Paste `apps-script.gs` → Deploy → Web App (Execute: Me, Access: Anyone) → Copy URL
3. **index.html**: Update `API_URL` dengan URL Apps Script
4. **Cloudinary**: Buat upload preset `gallery_upload` (Unsigned) → Enable "Resource list" di Security
5. **Test**: Buka `index.html` via Live Server / localhost

## Auth Flow
```
NEW USER:          EXISTING USER:
Phone → OTP →      Phone → checkPhone API
Create Password →  Login (password verify)
Register API       Login API
```

## Development
```bash
# Local dev
npx serve .          # or Live Server VS Code

# Deploy to GitHub Pages
git add -A
git commit -m "msg"
git push
```

## Key Commands
| Task | Command |
|------|---------|
| Test Apps Script | `curl -X POST -H "Content-Type: application/json" -d '{"action":"registerUser","phone":"08123","password":"1234"}' URL_APPS_SCRIPT` |
| Check Users | `curl "URL_APPS_SCRIPT?action=getUsers"` |
| Push to GitHub | `git push origin main` |

## Common Issues
- **Data not saving**: Apps Script belum deploy ulang
- **Phone loses 0**: Sheet kolom B format "Plain text"
- **Gallery empty**: Cloudinary assets belum tag `gallery` atau "Resource list" OFF
- **CORS error**: Pastikan Apps Script deployed as "Anyone"

## File Update Checklist
- [ ] Edit code
- [ ] Test local
- [ ] Deploy Apps Script (New version) jika backend berubah
- [ ] Commit & push