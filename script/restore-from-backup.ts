/**
 * One-time database restore for the DK Coaching migration.
 * Run AFTER `npm run db:push` has created the tables on the new database.
 *
 *   DATABASE_URL="<render external connection string>" npx tsx script/restore-from-backup.ts
 *
 * Reads the backups in ./db_backup/ (gitignored — keep private):
 *   - blog_published.json                 (public blog content)
 *   - leads_inquiries_audits_backup.json  (leads/enquiries/quiz submissions)
 */
import pg from "pg";
import { readFileSync } from "fs";
import path from "path";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function read(file: string): any {
  return JSON.parse(readFileSync(path.join("db_backup", file), "utf-8"));
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
  const client = await pool.connect();
  try {
    // --- Blog posts (from the public API backup; camelCase keys) ---
    const posts = read("blog_published.json");
    for (const p of posts) {
      await client.query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, published, published_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,now()),COALESCE($9,now()))
         ON CONFLICT (slug) DO NOTHING`,
        [p.title, p.slug, p.excerpt, p.content, p.coverImage ?? null,
         p.published ?? true, p.publishedAt ?? null, p.createdAt ?? null, p.updatedAt ?? null]
      );
    }
    console.log(`Blog posts restored: ${posts.length}`);

    // --- Leads / enquiries / quiz (from SQL json_agg backup; snake_case keys) ---
    const b = read("leads_inquiries_audits_backup.json");
    const root = Array.isArray(b) ? (b[0].backup ?? b[0]) : (b.backup ?? b);

    for (const r of root.audit_leads ?? []) {
      await client.query(
        `INSERT INTO audit_leads (first_name, email, overall_score, tier, area_scores, marketing_consent, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,now()))`,
        [r.first_name, r.email, r.overall_score ?? null, r.tier ?? null, r.area_scores ?? null, r.marketing_consent ?? false, r.created_at ?? null]
      );
    }
    for (const r of root.inquiries ?? []) {
      await client.query(
        `INSERT INTO inquiries (first_name, last_name, email, phone, subject, message, source, read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,now()))`,
        [r.first_name, r.last_name ?? null, r.email, r.phone ?? null, r.subject ?? null, r.message, r.source ?? "contact", r.read ?? false, r.created_at ?? null]
      );
    }
    for (const r of root.pos_audit_submissions ?? []) {
      await client.query(
        `INSERT INTO pos_audit_submissions
          (email, first_name, energy_score, time_score, conditions_score, direction_score, recovery_score,
           total_score, tier, weakest_dimension, raw_answers, consent_marketing, emailed_at, email_error, user_agent, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,COALESCE($16,now()))`,
        [r.email, r.first_name ?? null, r.energy_score, r.time_score, r.conditions_score, r.direction_score, r.recovery_score,
         r.total_score, r.tier, r.weakest_dimension, JSON.stringify(r.raw_answers ?? {}), r.consent_marketing ?? false,
         r.emailed_at ?? null, r.email_error ?? null, r.user_agent ?? null, r.created_at ?? null]
      );
    }
    console.log(`Audit leads: ${(root.audit_leads ?? []).length}, Enquiries: ${(root.inquiries ?? []).length}, POS submissions: ${(root.pos_audit_submissions ?? []).length}`);
    console.log("Restore complete.");
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
