# oss-data-analyst - Open Source AI Data Science Agent [Reference Architecture]

oss-data-analyst is an intelligent AI agent that converts natural language questions into SQL queries and provides data analysis. Built with the Vercel AI SDK, it features multi-phase reasoning (planning, building, execution, reporting) and streams results in real-time.

> **Note**: The semantic catalog in `src/semantic/` should reflect your own data model. This setup now targets PostgreSQL instead of the original demo SQLite database.

## Features

- **Multi-Phase AI Agent**: Planning → Building → Execution → Reporting workflow
- **Real-time Streaming**: Live updates during query processing
- **Smart Data Analysis**: Automated insights and visualizations
- **SQL Validation**: Syntax checking and security policy enforcement
- **Natural Language**: Ask questions in plain English
- **Modern UI**: Built with Next.js, React, and TailwindCSS
- **Extensible Tools**: Easy to add custom tools and capabilitiets

## Quick Start

### Prerequisites

- Node.js 20.19.3+
- pnpm 8.15.0+
- AI Gateway API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vercel/oss-data-analyst.git
   cd oss-data-analyst
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.example .env.local
   ```
   Edit `.env.local` and add:
   - `OPENAI_API_KEY`
   - Postgres connection (`POSTGRES_URL` or host/port/user/password/db + `POSTGRES_SSL`)

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm start
```

## Schema

Define your semantic model in `src/semantic/` (entities, catalog, dimensions). These files should mirror the tables/columns in your PostgreSQL database. Update them whenever your database schema changes.


## How It Works

oss-data-analyst uses a multi-phase agentic workflow:

1. **Planning Phase**
   - Analyzes natural language query
   - Searches semantic catalog for relevant entities
   - Identifies required data and relationships
   - Generates execution plan

2. **Building Phase**
   - Constructs SQL query from plan
   - Validates syntax and security policies
   - Optimizes query structure
   - Finds join paths between tables

3. **Execution Phase**
   - Estimates query cost
   - Executes SQL against database
   - Handles errors with automatic repair
   - Streams results

4. **Reporting Phase**
   - Formats query results
   - Generates visualizations (charts, tables)
   - Provides natural language explanations
   - Performs sanity checks on data

## Extending oss-data-analyst

### Customizing Prompts

Modify system prompts in `src/lib/prompts/`:
- `planning.ts` - Planning phase behavior
- `building.ts` - SQL generation logic
- `execution.ts` - Query execution handling
- `reporting.ts` - Results interpretation

## Example Queries

Try asking oss-data-analyst (using the sample database):

- "How many companies are in the Technology industry?"
- "What is the average salary by department?"
- "Show me the top 5 accounts by monthly value"
- "Which companies have the most employees?"
- "What is the total revenue for Active accounts?"
- "How many people work in Engineering?"

## Using with PostgreSQL

- SQL generation renders PostgreSQL syntax (filter aggregates, standard JOINs).
- The agent uses Postgres execution tools in `src/lib/tools/execute-postgres.ts`.
- Configure Postgres credentials in `.env.local` (URL or host/port/user/password).
- Ensure `src/semantic/` entities match your Postgres tables and schemas.

## Troubleshooting

**Database Connectivity**
- Verify Postgres env vars are set (`POSTGRES_URL` or host/port/user/password).
- Confirm your user has SELECT on the tables referenced in `src/semantic/`.

**AI Gateway API Errors**
- Verify your API key is valid in `.env.local`
- Check API rate limits and credits

**Build Errors**
- Run `pnpm install` to update dependencies
- Check TypeScript errors with `pnpm run type-check`
- Clear `.next` folder and rebuild
