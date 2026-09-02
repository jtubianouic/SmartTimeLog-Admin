# SmartTimeLog Admin

Next.js admin dashboard for the existing SmartTimeLog Supabase project.

## Environment

Copy `.env.example` to `.env.local` and fill in the existing project values. Variables prefixed with `NEXT_PUBLIC_` are browser-safe. `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` are server-only and must never be imported by Client Components or returned by an API.

Maps use Leaflet with OpenStreetMap tiles, so no Google Maps key is needed. OpenStreetMap attribution must remain visible in every map.

The existing Supabase schema, authentication, relationships, and RLS policies are the source of truth. This project does not create or reset database objects.

## Getting Started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Before implementing data access, link the existing project and generate its database types:

```bash
npx.cmd supabase login
npx.cmd supabase link --project-ref bkyedeokrypzamijzmxw
New-Item -ItemType Directory -Force src/types
npx.cmd supabase gen types typescript --linked | Set-Content src/types/database.ts
```

Run `npx supabase login` yourself in an interactive terminal. Never paste the personal access token into chat, source files, or `.env.local`.

## Bootstrap an Administrator

After configuring a valid server-only `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...`, create the initial Supabase Auth administrator with:

```powershell
npm.cmd run admin:create
```

The script defaults to `admin@smarttimelog.com`, prompts for the password securely, confirms the email, and sets `app_metadata.role` to `admin`. It does not store the password in an application table. To use another email:

```powershell
npm.cmd run admin:create -- -Email another-admin@example.com
```

The interface uses Sora and IBM Plex Mono through `next/font`.

## Flutter Employee Login

Send employee credentials to `POST /api/mobile/login` as JSON:

```json
{
	"username": "employee.username",
	"plainPassword": "employee password"
}
```

A valid active employee receives HTTP `200` with `ok: true`, a password-safe employee profile, and a 12-hour bearer token. Invalid credentials and removed employees receive HTTP `401` with `ok: false`. Use HTTPS in production.

Interactive Scalar documentation is available at `/api/docs`. The OpenAPI 3.1 document is available at `/api/openapi`.

```dart
Future<Map<String, dynamic>?> login(
	String username,
	String plainPassword,
) async {
	final response = await http.post(
		Uri.parse('$apiBaseUrl/api/mobile/login'),
		headers: {'Content-Type': 'application/json'},
		body: jsonEncode({
			'username': username,
			'plainPassword': plainPassword,
		}),
	);

	final body = jsonDecode(response.body) as Map<String, dynamic>;
	return response.statusCode == 200 && body['ok'] == true ? body : null;
}
```

Send `Authorization: Bearer <accessToken>` with calls to:

- `GET /api/mobile/status` returns today's `not_clocked_in`, `clocked_in`, `on_break`, or `clocked_out` state
- `POST /api/mobile/clock-in` with `lat` and `long`
- `POST /api/mobile/break` with `lat` and `long`
- `POST /api/mobile/clock-out` with `lat`, `long`, and `employeeInput`
- `POST /api/mobile/ai-summary` with `employeeInput`; it returns a summary without saving it

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
