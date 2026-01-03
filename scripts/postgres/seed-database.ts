import { config } from "dotenv";
import { Pool } from "pg";

// Load env vars from .env.local (if present) then .env
config({ path: ".env.local", override: true });
config();

const pool = new Pool();

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
];
const countries = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Canada",
];
const cities = [
  "New York",
  "London",
  "Berlin",
  "Paris",
  "Toronto",
  "San Francisco",
  "Seattle",
  "Boston",
  "Austin",
];
const departments = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
];
const jobTitles = [
  "Engineer",
  "Manager",
  "Director",
  "VP",
  "Analyst",
  "Specialist",
  "Coordinator",
];
const accountStatuses = ["Active", "Inactive", "Suspended", "Closed"];
const accountTypes = ["Enterprise", "Business", "Starter"];
const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Emily",
  "David",
  "Sarah",
  "James",
  "Jessica",
  "Robert",
  "Lisa",
  "William",
  "Amanda",
  "Richard",
  "Michelle",
  "Thomas",
  "Jennifer",
  "Charles",
  "Elizabeth",
  "Daniel",
  "Patricia",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Wilson",
  "Anderson",
  "Taylor",
  "Thomas",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Thompson",
  "White",
];

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date.toISOString().split("T")[0];
};

async function main() {
  console.log("🌱 Seeding Postgres database with sample data...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("🧹 Clearing existing data...");
    await client.query(
      "TRUNCATE accounts, people, companies RESTART IDENTITY CASCADE"
    );

    console.log("🏢 Inserting companies...");
    const insertCompany = `
      INSERT INTO companies (name, industry, employee_count, revenue, founded_year, country, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const companies: number[] = [];
    for (let i = 1; i <= 20; i++) {
      const { rows } = await client.query(insertCompany, [
        `${randomItem(industries)} Corp ${i}`,
        randomItem(industries),
        randomInt(50, 5000),
        randomInt(1_000_000, 100_000_000),
        randomInt(1990, 2020),
        randomItem(countries),
        randomItem(cities),
      ]);
      companies.push(rows[0].id as number);
    }

    console.log("👥 Inserting people...");
    const insertPerson = `
      INSERT INTO people (first_name, last_name, email, company_id, job_title, department, salary, hire_date, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const people: number[] = [];
    for (let i = 1; i <= 100; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

      const { rows } = await client.query(insertPerson, [
        firstName,
        lastName,
        email,
        randomItem(companies),
        `${randomItem(jobTitles)}`,
        randomItem(departments),
        randomInt(40_000, 200_000),
        randomDate(new Date(2015, 0, 1), new Date(2024, 11, 31)),
        randomDate(new Date(1970, 0, 1), new Date(2000, 11, 31)),
      ]);
      people.push(rows[0].id as number);
    }

    console.log("💼 Inserting accounts...");
    const insertAccount = `
      INSERT INTO accounts (account_number, company_id, account_manager_id, status, account_type, monthly_value, total_revenue, contract_start_date, contract_end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    for (let i = 1; i <= 50; i++) {
      const accountNumber = `ACC-${String(i).padStart(6, "0")}`;
      const monthlyValue = randomInt(1_000, 50_000);
      const contractStartDate = randomDate(
        new Date(2020, 0, 1),
        new Date(2024, 0, 1)
      );
      const startDate = new Date(contractStartDate);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + randomInt(1, 3));

      const monthsActive = Math.max(
        1,
        Math.floor(
          (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      );
      const totalRevenue = monthlyValue * monthsActive;

      await client.query(insertAccount, [
        accountNumber,
        randomItem(companies),
        randomItem(people),
        randomItem(accountStatuses),
        randomItem(accountTypes),
        monthlyValue,
        totalRevenue,
        contractStartDate,
        endDate.toISOString().split("T")[0],
      ]);
    }

    const stats = {
      companies: (
        await client.query("SELECT COUNT(*)::int AS count FROM companies")
      ).rows[0].count as number,
      people: (
        await client.query("SELECT COUNT(*)::int AS count FROM people")
      ).rows[0].count as number,
      accounts: (
        await client.query("SELECT COUNT(*)::int AS count FROM accounts")
      ).rows[0].count as number,
    };

    await client.query("COMMIT");

    console.log("\n✅ Database seeding complete!");
    console.log(`📊 Statistics:`);
    console.log(`   - Companies: ${stats.companies}`);
    console.log(`   - People: ${stats.people}`);
    console.log(`   - Accounts: ${stats.accounts}`);

    console.log("\n💡 Try these sample queries:");
    console.log("   - How many companies are in the Technology industry?");
    console.log("   - What is the average salary by department?");
    console.log("   - Show me the top 5 accounts by monthly value");
    console.log("   - Which companies have the most employees?");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to seed Postgres database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
