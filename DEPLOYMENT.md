# Deployment Guide

## Setup (One-Time Only)

### 1. Environment Variables
Your `.env.local` file should contain:
```
GEMINI_API_KEY=your_api_key_here
```

### 2. Vercel Environment Variables
Add the same `GEMINI_API_KEY` to Vercel:
- Go to https://vercel.com/ramitamir/curiomap/settings/environment-variables
- Add `GEMINI_API_KEY` with your API key value
- Set it for Production (and optionally Preview/Development)

---

## Deploying Changes

### Quick Deploy (Automatic)
Once connected to GitHub, Vercel automatically deploys when you push to `main`:

```bash
# 1. Stage your changes
git add .

# 2. Commit with a descriptive message
git commit -m "Description of what you changed"

# 3. Push to GitHub
git push origin main
```

That's it! Vercel will automatically:
- Detect the push
- Build your Next.js app
- Deploy to production
- Give you a deployment URL

---

## Manual Deploy (If Needed)

If automatic deployment fails or you need to redeploy:

1. Go to https://vercel.com/ramitamir/curiomap
2. Click the **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Confirm the redeploy

---

## Testing Locally Before Deploy

Always test your changes locally first:

```bash
# Run dev server
npm run dev

# Test in browser at http://localhost:3000

# Build production version to check for errors
npm run build
```

---

## Checking Deployment Status

- **Vercel Dashboard:** https://vercel.com/ramitamir/curiomap
- **Live Site:** https://curiomap.vercel.app (or your custom domain)
- **GitHub Repo:** https://github.com/ramitamir/curiomap

---

## Troubleshooting

### Build Fails
- Check the Vercel deployment logs for errors
- Make sure the code builds locally: `npm run build`
- Verify environment variables are set in Vercel

### API Not Working in Production
- Verify `GEMINI_API_KEY` is set in Vercel environment variables
- Check Vercel function logs for API errors

### Changes Not Showing Up
- Check that your git push succeeded: `git status`
- Verify deployment completed in Vercel dashboard
- Try hard refresh in browser: `Cmd + Shift + R`

---

## Git Tips

```bash
# Check what's changed
git status

# See recent commits
git log --oneline -5

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# View remote URL
git remote -v
```
