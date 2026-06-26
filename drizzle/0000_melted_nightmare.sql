CREATE TYPE "public"."difficulty" AS ENUM('Easy', 'Med', 'Hard');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('solved', 'attempted', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."track_category" AS ENUM('dsa', 'system_design');--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" text,
	"mood" integer
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" "difficulty" DEFAULT 'Easy' NOT NULL,
	"image_urls" text[] DEFAULT '{}',
	"examples" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone,
	"full_name" text,
	"avatar_url" text
);
--> statement-breakpoint
CREATE TABLE "solution_panels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"user_id" uuid,
	"language" text NOT NULL,
	"code_content" text DEFAULT '',
	"whiteboard_data" jsonb DEFAULT '{}'::jsonb,
	"time_complexity" text,
	"space_complexity" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "track_category" DEFAULT 'dsa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_problems_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"status" "status" DEFAULT 'attempted' NOT NULL,
	"notes" text,
	"url" text,
	"time_taken" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution_panels" ADD CONSTRAINT "solution_panels_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution_panels" ADD CONSTRAINT "solution_panels_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problems_tracking" ADD CONSTRAINT "user_problems_tracking_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problems_tracking" ADD CONSTRAINT "user_problems_tracking_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;