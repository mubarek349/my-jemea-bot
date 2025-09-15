# Font Setup Instructions

Due to the Google Fonts connection issue during build, we've switched to using local font files.

## Required Font Files

Download the following files and place them in the `app/fonts/` directory:

### Geist Sans
- **File**: `GeistVF.woff2`
- **Source**: [Vercel Geist Repository](https://github.com/vercel/geist-font)
- **Direct Download**: https://github.com/vercel/geist-font/raw/main/packages/next/src/GeistVF.woff2

### Geist Mono  
- **File**: `GeistMonoVF.woff2`
- **Source**: [Vercel Geist Repository](https://github.com/vercel/geist-font)
- **Direct Download**: https://github.com/vercel/geist-font/raw/main/packages/next/src/GeistMonoVF.woff2

## Quick Setup Commands

Run these commands to download the font files:

```bash
# Download Geist Sans
curl -L -o app/fonts/GeistVF.woff2 https://github.com/vercel/geist-font/raw/main/packages/next/src/GeistVF.woff2

# Download Geist Mono
curl -L -o app/fonts/GeistMonoVF.woff2 https://github.com/vercel/geist-font/raw/main/packages/next/src/GeistMonoVF.woff2
```

## Alternative: PowerShell Commands (Windows)

```powershell
# Download Geist Sans
Invoke-WebRequest -Uri "https://github.com/vercel/geist-font/raw/main/packages/next/src/GeistVF.woff2" -OutFile "app/fonts/GeistVF.woff2"

# Download Geist Mono
Invoke-WebRequest -Uri "https://github.com/vercel/geist-font/raw/main/packages/next/src/GeistMonoVF.woff2" -OutFile "app/fonts/GeistMonoVF.woff2"
```

## Fallback Behavior

If the font files are not available, the application will fall back to:
- **Sans-serif**: Inter → system-ui → -apple-system → BlinkMacSystemFont → Segoe UI → Roboto → sans-serif
- **Monospace**: Menlo → Monaco → Consolas → Liberation Mono → Courier New → monospace

## Verify Installation

After downloading the fonts, your directory structure should look like:

```
app/
├── fonts/
│   ├── GeistVF.woff2
│   └── GeistMonoVF.woff2
├── layout.tsx
└── globals.css
```