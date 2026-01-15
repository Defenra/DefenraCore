# Defenra Core

Management dashboard and API for Defenra distributed DDoS protection platform. Built with Next.js 16, MongoDB, and NextAuth.

## What It Does

- **Agent Management** - Register, configure, and monitor edge agents
- **Domain Configuration** - DNS records, GeoDNS routing, SSL certificates
- **WAF Rules** - Lua-based Web Application Firewall scripts
- **Proxy Configuration** - HTTP/HTTPS reverse proxy settings
- **Statistics** - Traffic metrics, attack logs, agent health
- **User Management** - Multi-user authentication and authorization

## Requirements

- Node.js 23+
- MongoDB 5.0+

## Installation

Clone and install dependencies:

```bash
git clone https://github.com/Defenra/DefenraCore.git
cd DefenraCore
npm install
```

Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/defenra
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

Generate a random secret:

```bash
openssl rand -base64 32
```

## Running

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Access the dashboard at http://localhost:3000

## First-Time Setup

On first launch with an empty database:

1. Navigate to http://localhost:3000
2. You'll be redirected to `/setup`
3. Create an admin account
4. Log in with your credentials

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── agent/              # Agent polling, stats, connection
│   │   ├── domain/             # Domain CRUD operations
│   │   ├── proxy/              # Proxy configuration
│   │   ├── geodns/             # GeoDNS mapping
│   │   └── auth/               # NextAuth endpoints
│   ├── dashboard/              # Dashboard pages
│   │   ├── agents/             # Agent management
│   │   ├── domains/            # Domain management
│   │   ├── statistics/         # Traffic stats
│   │   └── profile/            # User profile
│   ├── login/                  # Login page
│   └── setup/                  # Initial setup page
├── components/                 # React components
├── lib/
│   ├── auth.js                 # NextAuth configuration
│   ├── mongodb.js              # MongoDB connection
│   └── ipInfo.js               # GeoIP lookup (MaxMind)
├── models/                     # Mongoose schemas
│   ├── User.js
│   ├── Agent.js
│   ├── Domain.js
│   └── Proxy.js
└── middleware.js               # Route protection
```

## API Endpoints

### Agent API

Agents poll these endpoints every 60 seconds:

```
POST /api/agent/poll
POST /api/agent/stats
GET  /api/agent/connect/:token
```

### Dashboard API

```
GET    /api/agent/list
POST   /api/agent/create
DELETE /api/agent/:id

GET    /api/domain/list
POST   /api/domain/create
PUT    /api/domain/:id
DELETE /api/domain/:id

GET    /api/statistics
GET    /api/logs
```

See [AGENT_API_INTEGRATION.md](AGENT_API_INTEGRATION.md) for detailed API documentation.

## Configuration

### MongoDB

Local MongoDB:

```
MONGODB_URI=mongodb://localhost:27017/defenra
```

MongoDB Atlas:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/defenra
```

### NextAuth

Required environment variables:

```
NEXTAUTH_SECRET=<random-32-byte-string>
NEXTAUTH_URL=http://localhost:3000
```

In production, set `NEXTAUTH_URL` to your domain.

### GeoIP Database

Download MaxMind GeoLite2-City database:

```bash
mkdir -p data
cd data
wget https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb
```

The database is used for agent geolocation and GeoDNS fallback calculations.

## Development

Format code:

```bash
npm run format
```

Lint code:

```bash
npm run lint
```

## Deployment

### Docker

```bash
docker build -t defenra-core .
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/defenra \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=https://your-domain.com \
  defenra-core
```

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### VPS

```bash
npm run build
pm2 start npm --name defenra-core -- start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth 5 (beta)
- **Database**: MongoDB with Mongoose
- **UI**: Tailwind CSS 4, Radix UI, Lucide icons
- **Code Quality**: Biome (formatter + linter)

## Documentation

- [Agent API Integration](AGENT_API_INTEGRATION.md) - API contract between Core and Agent
- [Architecture](../docs/Architecture/Overview.md) - System architecture and data flows

## License

MIT
