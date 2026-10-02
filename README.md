# Portfolio + CMS

A personal portfolio (Next.js 16, App Router) with a built-in admin dashboard. All portfolio content — profile, projects, experience, skills, education, certifications, hackathons and resume — lives in MongoDB and is edited at `/admin`. Saving in the dashboard updates the public site on the next page load; no code changes or redeploys needed.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · MongoDB/Mongoose · Auth.js v5 · Zod · React Hook Form · TanStack Query · Cloudinary

## How it fits together

```
src/
├── app/
│   ├── (public)/            Public site: home, /projects, /projects/[slug], /blog
│   ├── admin/
│   │   ├── (auth)/login     Sign-in page (server action → Auth.js)
│   │   └── (cms)/           Dashboard, Projects, Experience, Skills, Education,
│   │                        Certifications, Hackathons, Resume, Profile, Settings
│   ├── api/admin/*          Admin-only REST routes (GET/POST/PATCH/DELETE)
│   ├── api/auth/*           Auth.js handlers
│   ├── resume/route.ts      Stable /resume link → current active resume PDF
│   ├── sitemap.ts, robots.ts
├── components/              Original portfolio components (reused) + admin/ + ui/
├── lib/
│   ├── auth/                Auth.js config, credentials provider, server-side guards
│   ├── api/                 Response envelope, error mapping, CRUD route factory
│   ├── data/portfolio.ts    Cached, tagged read functions for the public site
│   ├── validations/         Zod schemas shared by forms and API routes
│   ├── db/                  Pooled Mongo connection, serialization
│   ├── cloudinary/, media.ts, uploads.ts   File storage + validation + cleanup
├── models/                  Mongoose models
├── proxy.ts                 Route gate for /admin and /api/admin
scripts/                     seed.ts, create-admin.ts, seed-data.ts
```

- **Reads:** public pages are statically generated. Data comes from `lib/data/portfolio.ts`, cached with tags (`projects`, `profile`, …).
- **Writes:** admin API routes validate with Zod, write to MongoDB, then call `revalidateTag(tag, { expire: 0 })`. The next visit re-renders the affected pages with fresh data.
- **Auth:** the proxy rejects requests without a session. Every admin page, API route and action also re-checks the session against the database.

## Local setup

Requirements: Node.js ≥ 20.12, a MongoDB database (local or [Atlas](https://www.mongodb.com/atlas)), and a free [Cloudinary](https://cloudinary.com) account.

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run seed                    # imports the original portfolio content
npm run create-admin            # creates your admin login (prompts for a password if ADMIN_PASSWORD is empty)
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin to sign in.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Session signing secret — `npx auth secret` |
| `NEXT_PUBLIC_SITE_URL` | Public origin for canonical URLs, Open Graph, sitemap |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image and PDF storage |
| `CLOUDINARY_FOLDER` | Optional upload root folder (default `portfolio`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Read only by `npm run create-admin`. Delete the password afterwards. |

**Cloudinary:** free accounts block PDF delivery by default. Enable *Settings → Security → "Allow delivery of PDF and ZIP files"*, or the resume link will return 401.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint 9 / `tsc --noEmit` |
| `npm run seed` | Seeds only empty collections (safe to re-run). `npm run seed -- --force` replaces content. |
| `npm run create-admin` | Creates the admin. `-- --reset` changes the password and signs out every session. |

## Deploying (Vercel)

1. Create a MongoDB Atlas cluster. Under Network Access, allow your host (for Vercel: `0.0.0.0/0`, protected by a strong DB password).
2. Locally, set `MONGODB_URI` to the production database and run `npm run seed` and `npm run create-admin` once.
3. Import the repo in Vercel and add every variable from `.env.example` except `ADMIN_*`. Set `NEXT_PUBLIC_SITE_URL` to your domain.
4. Deploy. The build prerenders public pages from the database, so `MONGODB_URI` must be reachable during the build.

Other Node hosts work the same way: `npm run build && npm start` with the same environment variables. Run the app behind HTTPS so session cookies are marked `Secure`.

## Security notes

- Passwords are hashed with bcrypt (cost 12). No credentials are hard-coded; the first admin is created by script.
- Sessions are HTTP-only, SameSite=Lax JWT cookies that expire after 8 hours. Changing the password revokes every existing session.
- Login is rate-limited per IP and per email (MongoDB-backed, so the limit holds across serverless instances). Password changes are rate-limited too.
- Admin mutations check the `Origin` header to block CSRF. Server actions get Next.js's built-in origin check.
- All input is validated by strict Zod schemas: unknown keys are rejected, URLs must be http(s), and ids must be valid ObjectIds. Mongoose `sanitizeFilter` is enabled.
- File type is checked from the file's bytes, not the extension. Images (JPEG/PNG/WebP/GIF/AVIF, no SVG) and resume PDFs are each limited to 4 MB.
- API errors return `{ success, message, errors? }`. Stack traces and database errors are logged on the server and never sent to the client.
- Security headers are set (`X-Frame-Options`, `nosniff`, HSTS, `frame-ancestors`), and `/admin` is marked `noindex`.

## License

MIT
