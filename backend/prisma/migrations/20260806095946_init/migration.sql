-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_expiration" DATE NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(150),
    "phone" VARCHAR(50),
    "role" VARCHAR(40) NOT NULL DEFAULT 'superviseur',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "twofa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(6),
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_codes" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN DEFAULT false,
    "attempts" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'actif',
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(40),
    "address" VARCHAR(255),
    "city" VARCHAR(120),
    "quartier" VARCHAR(120),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "contact_name" VARCHAR(150),
    "contact_phone" VARCHAR(50),
    "contact_email" VARCHAR(190),
    "website" VARCHAR(255),
    "logo_url" VARCHAR(255),
    "capacity" INTEGER,
    "surface" DECIMAL(8,2),
    "floor" VARCHAR(50),
    "layouts" JSONB,
    "equipment" JSONB,
    "price_per_day" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'XAF',
    "is_bookable" BOOLEAN NOT NULL DEFAULT true,
    "plan_url" VARCHAR(255),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255),
    "client_email" VARCHAR(255) NOT NULL,
    "client_phone" VARCHAR(50),
    "company_name" VARCHAR(255),
    "date_start" TIMESTAMP(6) NOT NULL,
    "date_end" TIMESTAMP(6) NOT NULL,
    "location_id" INTEGER NOT NULL,
    "services" JSONB NOT NULL,
    "payment_method" VARCHAR(40) NOT NULL,
    "conditions_accepted" BOOLEAN DEFAULT false,
    "status" VARCHAR(20) DEFAULT 'En attente',
    "is_waitlisted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "attendees" INTEGER,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" SERIAL NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "rating" SMALLINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "keep_forever" BOOLEAN NOT NULL DEFAULT false,
    "event_id" INTEGER,
    "client_email" VARCHAR(190),
    "moderated_at" TIMESTAMP(6),
    "moderated_by" INTEGER,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'nouveau',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "replied_at" TIMESTAMP(6),
    "read_at" TIMESTAMP(6),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_replies" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "admin_email" VARCHAR(190),
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(80) NOT NULL,
    "value" TEXT,
    "type" VARCHAR(10) NOT NULL DEFAULT 'string',
    "group_key" VARCHAR(40) NOT NULL,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "weekday" SMALLINT NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "open_at" TIME(0) NOT NULL DEFAULT '08:00:00'::time without time zone,
    "close_at" TIME(0) NOT NULL DEFAULT '19:00:00'::time without time zone,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("weekday")
);

-- CreateTable
CREATE TABLE "closures" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'Férié',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'forfait',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "key" VARCHAR(40) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" SERIAL NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "event_id" INTEGER,
    "recipient" VARCHAR(190) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'envoye',
    "detail" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_log" (
    "id" SERIAL NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "detail" VARCHAR(255),
    "status" VARCHAR(10) NOT NULL DEFAULT 'succes',
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "target" VARCHAR(190),
    "detail" VARCHAR(500),
    "status" VARCHAR(10) NOT NULL DEFAULT 'succes',
    "changes" JSONB,
    "user_id" INTEGER,
    "actor_name" VARCHAR(120),
    "actor_email" VARCHAR(190),
    "actor_role" VARCHAR(40),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "method" VARCHAR(8),
    "path" VARCHAR(190),
    "http_status" SMALLINT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_created_by_idx" ON "users"("created_by");

-- CreateIndex
CREATE INDEX "password_reset_codes_email_idx" ON "password_reset_codes"("email");

-- CreateIndex
CREATE INDEX "password_reset_codes_expires_at_idx" ON "password_reset_codes"("expires_at");

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "locations"("parent_id");

-- CreateIndex
CREATE INDEX "locations_status_idx" ON "locations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_name_parent" ON "locations"("parent_id", "name");

-- CreateIndex
CREATE INDEX "events_date_start_idx" ON "events"("date_start");

-- CreateIndex
CREATE INDEX "events_status_date_start_idx" ON "events"("status", "date_start");

-- CreateIndex
CREATE INDEX "events_client_email_idx" ON "events"("client_email");

-- CreateIndex
CREATE INDEX "events_location_id_is_waitlisted_idx" ON "events"("location_id", "is_waitlisted");

-- CreateIndex
CREATE INDEX "testimonials_event_id_idx" ON "testimonials"("event_id");

-- CreateIndex
CREATE INDEX "testimonials_moderated_by_idx" ON "testimonials"("moderated_by");

-- CreateIndex
CREATE INDEX "testimonials_status_idx" ON "testimonials"("status");

-- CreateIndex
CREATE INDEX "testimonials_is_featured_idx" ON "testimonials"("is_featured");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- CreateIndex
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");

-- CreateIndex
CREATE INDEX "message_replies_admin_id_idx" ON "message_replies"("admin_id");

-- CreateIndex
CREATE INDEX "message_replies_message_id_idx" ON "message_replies"("message_id");

-- CreateIndex
CREATE INDEX "app_settings_group_key_idx" ON "app_settings"("group_key");

-- CreateIndex
CREATE INDEX "app_settings_updated_by_idx" ON "app_settings"("updated_by");

-- CreateIndex
CREATE INDEX "closures_date_from_date_to_idx" ON "closures"("date_from", "date_to");

-- CreateIndex
CREATE UNIQUE INDEX "uq_service_name" ON "service_catalog"("name");

-- CreateIndex
CREATE INDEX "email_log_kind_created_at_idx" ON "email_log"("kind", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_kind_event" ON "email_log"("kind", "event_id");

-- CreateIndex
CREATE INDEX "maintenance_log_action_created_at_idx" ON "maintenance_log"("action", "created_at");

-- CreateIndex
CREATE INDEX "maintenance_log_user_id_idx" ON "maintenance_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_category_created_at_idx" ON "audit_log"("category", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit_log"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_replies" ADD CONSTRAINT "message_replies_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "contact_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_replies" ADD CONSTRAINT "message_replies_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_log" ADD CONSTRAINT "maintenance_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
