import { pgTable, text, varchar, serial, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  source: text("source").notNull().default("contact"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  programme: text("programme").notNull(),
  situation: text("situation"),
  goals: text("goals"),
  source: text("source"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export const auditLeads = pgTable("audit_leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  overallScore: integer("overall_score"),
  tier: text("tier"),
  areaScores: text("area_scores"),
  marketingConsent: boolean("marketing_consent").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLeadSchema = createInsertSchema(auditLeads).omit({
  id: true,
  createdAt: true,
});

export type AuditLead = typeof auditLeads.$inferSelect;
export type InsertAuditLead = z.infer<typeof insertAuditLeadSchema>;

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("blog"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export const posAuditSubmissions = pgTable("pos_audit_submissions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  energyScore: integer("energy_score").notNull(),
  timeScore: integer("time_score").notNull(),
  conditionsScore: integer("conditions_score").notNull(),
  directionScore: integer("direction_score").notNull(),
  recoveryScore: integer("recovery_score").notNull(),
  totalScore: integer("total_score").notNull(),
  tier: text("tier").notNull(),
  weakestDimension: text("weakest_dimension").notNull(),
  rawAnswers: jsonb("raw_answers").notNull(),
  consentMarketing: boolean("consent_marketing").notNull().default(false),
  emailedAt: timestamp("emailed_at"),
  emailError: text("email_error"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PosAuditSubmission = typeof posAuditSubmissions.$inferSelect;

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  read: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  read: true,
  createdAt: true,
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
