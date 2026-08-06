--
-- PostgreSQL database dump
--

\restrict 0gaG6cd5EV4N3SEq0jXzyxRpiP9EHu5C7TD6RTWhsant4PLvINb8Ydko0ZKth3J

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key character varying(80) NOT NULL,
    value text,
    type character varying(10) DEFAULT 'string'::character varying NOT NULL,
    group_key character varying(40) NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    updated_by integer,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT app_settings_type_check CHECK (((type)::text = ANY ((ARRAY['string'::character varying, 'int'::character varying, 'float'::character varying, 'bool'::character varying, 'json'::character varying])::text[])))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    category character varying(20) NOT NULL,
    action character varying(120) NOT NULL,
    target character varying(190),
    detail character varying(500),
    status character varying(10) DEFAULT 'succes'::character varying NOT NULL,
    changes jsonb,
    user_id integer,
    actor_name character varying(120),
    actor_email character varying(190),
    actor_role character varying(40),
    ip character varying(64),
    user_agent character varying(255),
    method character varying(8),
    path character varying(190),
    http_status smallint,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_log_category_check CHECK (((category)::text = ANY ((ARRAY['param'::character varying, 'resa'::character varying, 'moder'::character varying, 'systeme'::character varying, 'email'::character varying, 'acces'::character varying, 'contenu'::character varying, 'users'::character varying])::text[]))),
    CONSTRAINT audit_log_status_check CHECK (((status)::text = ANY ((ARRAY['succes'::character varying, 'echec'::character varying, 'attention'::character varying])::text[])))
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: business_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_hours (
    weekday smallint NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    open_at time(0) without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    close_at time(0) without time zone DEFAULT '19:00:00'::time without time zone NOT NULL
);


--
-- Name: closures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.closures (
    id integer NOT NULL,
    label character varying(150) NOT NULL,
    date_from date NOT NULL,
    date_to date NOT NULL,
    kind character varying(20) DEFAULT 'Férié'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT closures_kind_check CHECK (((kind)::text = ANY ((ARRAY['Férié'::character varying, 'Technique'::character varying, 'Autre'::character varying])::text[])))
);


--
-- Name: closures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.closures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: closures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.closures_id_seq OWNED BY public.closures.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    status character varying(20) DEFAULT 'nouveau'::character varying,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    replied_at timestamp(6) without time zone,
    read_at timestamp(6) without time zone,
    CONSTRAINT contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['nouveau'::character varying, 'lu'::character varying, 'traite'::character varying])::text[])))
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: email_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_log (
    id integer NOT NULL,
    kind character varying(40) NOT NULL,
    event_id integer,
    recipient character varying(190) NOT NULL,
    status character varying(10) DEFAULT 'envoye'::character varying NOT NULL,
    detail character varying(255),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_log_status_check CHECK (((status)::text = ANY ((ARRAY['envoye'::character varying, 'echec'::character varying, 'ignore'::character varying])::text[])))
);


--
-- Name: email_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_log_id_seq OWNED BY public.email_log.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    key character varying(40) NOT NULL,
    label character varying(120) NOT NULL,
    subject character varying(200) NOT NULL,
    body text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    client_name character varying(255) NOT NULL,
    title character varying(255),
    client_email character varying(255) NOT NULL,
    client_phone character varying(50),
    company_name character varying(255),
    date_start timestamp(6) without time zone NOT NULL,
    date_end timestamp(6) without time zone NOT NULL,
    location_id integer NOT NULL,
    services jsonb NOT NULL,
    payment_method character varying(40) NOT NULL,
    conditions_accepted boolean DEFAULT false,
    status character varying(20) DEFAULT 'En attente'::character varying,
    is_waitlisted boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    attendees integer,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT events_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['Virement bancaire'::character varying, 'Espèces'::character varying, 'MTN Mobile Money'::character varying, 'Orange Money'::character varying, 'Chèque'::character varying])::text[]))),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['En attente'::character varying, 'Confirmé'::character varying, 'Annulé'::character varying])::text[])))
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    parent_id integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    status character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(40),
    address character varying(255),
    city character varying(120),
    quartier character varying(120),
    latitude numeric(10,7),
    longitude numeric(10,7),
    contact_name character varying(150),
    contact_phone character varying(50),
    contact_email character varying(190),
    website character varying(255),
    logo_url character varying(255),
    capacity integer,
    surface numeric(8,2),
    floor character varying(50),
    layouts jsonb,
    equipment jsonb,
    price_per_day numeric(12,2),
    currency character(3) DEFAULT 'XAF'::bpchar NOT NULL,
    is_bookable boolean DEFAULT true NOT NULL,
    plan_url character varying(255),
    CONSTRAINT locations_status_check CHECK (((status)::text = ANY ((ARRAY['actif'::character varying, 'inactif'::character varying, 'archive'::character varying])::text[]))),
    CONSTRAINT locations_type_check CHECK (((type)::text = ANY ((ARRAY['Hôtel'::character varying, 'Club privé'::character varying, 'Centre de congrès'::character varying, 'Salle des fêtes'::character varying, 'Autre'::character varying])::text[])))
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: maintenance_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_log (
    id integer NOT NULL,
    action character varying(60) NOT NULL,
    detail character varying(255),
    status character varying(10) DEFAULT 'succes'::character varying NOT NULL,
    user_id integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT maintenance_log_status_check CHECK (((status)::text = ANY ((ARRAY['succes'::character varying, 'echec'::character varying])::text[])))
);


--
-- Name: maintenance_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_log_id_seq OWNED BY public.maintenance_log.id;


--
-- Name: message_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_replies (
    id integer NOT NULL,
    message_id integer NOT NULL,
    admin_id integer,
    admin_email character varying(190),
    body text NOT NULL,
    sent_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: message_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_replies_id_seq OWNED BY public.message_replies.id;


--
-- Name: password_reset_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code_hash character varying(255) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    used boolean DEFAULT false,
    attempts integer DEFAULT 0,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_codes_id_seq OWNED BY public.password_reset_codes.id;


--
-- Name: service_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_catalog (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    unit character varying(20) DEFAULT 'forfait'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT service_catalog_unit_check CHECK (((unit)::text = ANY ((ARRAY['forfait'::character varying, 'par jour'::character varying, 'par personne'::character varying, 'par heure'::character varying])::text[])))
);


--
-- Name: service_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_catalog_id_seq OWNED BY public.service_catalog.id;


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    client_name character varying(255) NOT NULL,
    comment text NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    rating smallint,
    status character varying(20) DEFAULT 'en_attente'::character varying NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    keep_forever boolean DEFAULT false NOT NULL,
    event_id integer,
    client_email character varying(190),
    moderated_at timestamp(6) without time zone,
    moderated_by integer,
    CONSTRAINT testimonials_status_check CHECK (((status)::text = ANY ((ARRAY['en_attente'::character varying, 'publie'::character varying, 'masque'::character varying])::text[])))
);


--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    password_expiration date NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(150),
    phone character varying(50),
    role character varying(40) DEFAULT 'superviseur'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    twofa_enabled boolean DEFAULT false NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    last_login_at timestamp(6) without time zone,
    created_by integer,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'superviseur'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: closures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closures ALTER COLUMN id SET DEFAULT nextval('public.closures_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: email_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_log ALTER COLUMN id SET DEFAULT nextval('public.email_log_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: maintenance_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_log ALTER COLUMN id SET DEFAULT nextval('public.maintenance_log_id_seq'::regclass);


--
-- Name: message_replies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_replies ALTER COLUMN id SET DEFAULT nextval('public.message_replies_id_seq'::regclass);


--
-- Name: password_reset_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes ALTER COLUMN id SET DEFAULT nextval('public.password_reset_codes_id_seq'::regclass);


--
-- Name: service_catalog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_catalog ALTER COLUMN id SET DEFAULT nextval('public.service_catalog_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1552b8cb-efd0-40d3-a6df-fa4311095b66	e1dc737309682f9930221ae265fe3f5ffda2226fa59a338981816fa3cb3530ae	2026-08-06 09:59:47.745899+00	20260806095946_init	\N	\N	2026-08-06 09:59:46.78337+00	1
760f3921-289b-4466-bc17-2a5c8f87796d	a5c5a8836c17cba3eb14f6d8d3e805188219a3c9780654bee560952e6950edb2	2026-08-06 10:02:07.28742+00	20260806100050_value_constraints	\N	\N	2026-08-06 10:02:07.137345+00	1
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (key, value, type, group_key, is_secret, updated_by, updated_at) FROM stdin;
accent_color	#1e40af	string	marque	f	1	2026-08-04 10:08:17
accent_default	#1e40af	string	marque	f	\N	2026-08-04 09:34:28
address	Yaoundé, Cameroun	string	contact	f	\N	2026-08-04 07:12:30
allow_over_capacity	0	bool	resa	f	\N	2026-08-04 07:12:30
allow_overlap	0	bool	resa	f	\N	2026-08-04 07:12:30
app_version	v2.4.1	string	systeme	f	\N	2026-08-04 07:12:30
auto_backup	1	bool	systeme	f	\N	2026-08-04 07:12:30
auto_confirm	0	bool	resa	f	\N	2026-08-04 07:12:30
backup_frequency	Quotidienne	string	systeme	f	\N	2026-08-04 07:12:30
bank_holder		string	paiement	f	\N	2026-08-04 07:12:30
bank_name		string	paiement	f	\N	2026-08-04 07:12:30
bank_rib		string	paiement	f	\N	2026-08-04 07:12:30
bank_swift		string	paiement	f	\N	2026-08-04 07:12:30
banner_enabled	0	bool	site	f	1	2026-08-04 13:58:40
banner_text		string	site	f	1	2026-08-04 15:31:54
buffer_hours	2	int	horaires	f	\N	2026-08-04 07:12:30
cancel_lead_days	5	int	resa	f	\N	2026-08-04 07:12:30
cancel_policy	Toute annulation intervenant plus de 5 jours avant la date de l'événement donne lieu au remboursement intégral de l'acompte.	string	resa	f	\N	2026-08-04 07:12:30
contact_manager	Felix TANZI	string	contact	f	1	2026-08-04 11:38:26
currency	XAF	string	marque	f	\N	2026-08-04 07:12:30
date_format	DD/MM/YYYY	string	marque	f	\N	2026-08-04 07:12:30
default_status	En attente	string	resa	f	\N	2026-08-04 07:12:30
deposit_rate	30	float	services	f	\N	2026-08-04 07:12:30
email_bookings	tanzifelix@gmail.com	string	contact	f	1	2026-08-04 09:00:57
email_contact	tanzifelix@gmail.com	string	contact	f	1	2026-08-04 09:00:57
favicon_url	/uploads/branding/favicon.png	string	marque	f	\N	2026-08-04 07:12:30
home_sections	{"hero":true,"calendar":true,"upcoming":true,"services":true,"reviews":true,"cta":true}	json	site	f	1	2026-08-04 13:48:00
internal_recipients	[]	json	notif	f	\N	2026-08-04 07:12:30
invoice_next	1	int	paiement	f	\N	2026-08-04 07:12:30
invoice_notes	Facture payable à réception.	string	paiement	f	\N	2026-08-04 07:12:30
invoice_prefix	NPE-2026-	string	paiement	f	\N	2026-08-04 07:12:30
language	fr	string	marque	f	\N	2026-08-04 07:12:30
legal_name	NetandPro SARL	string	contact	f	\N	2026-08-04 07:12:30
log_retention_days	90	int	systeme	f	\N	2026-08-04 07:12:30
logo_url	/uploads/branding/logo-1785838684058.png	string	marque	f	1	2026-08-04 10:18:04
maintenance_message	Site en maintenance. Merci de nous appeler pour toute urgence	string	site	f	1	2026-08-04 13:57:31
maintenance_mode	0	bool	site	f	1	2026-08-04 13:57:54
max_bookings_per_day	2	int	horaires	f	\N	2026-08-04 07:12:30
max_duration_days	7	int	resa	f	\N	2026-08-04 07:12:30
min_lead_days	3	int	resa	f	\N	2026-08-04 07:12:30
niu		string	contact	f	\N	2026-08-04 07:12:30
payment_lead_hours	48	int	services	f	\N	2026-08-04 07:12:30
payment_methods	{"Virement bancaire":{"on":true,"account":""},"MTN Mobile Money":{"on":true,"account":""},"Orange Money":{"on":true,"account":""},"Espèces":{"on":true,"account":"Encaissement au siège"},"Chèque":{"on":false,"account":""}}	json	paiement	f	\N	2026-08-04 07:12:30
phone_main	698200792	string	contact	f	1	2026-08-04 09:00:57
phone_whatsapp	698200792	string	contact	f	1	2026-08-04 09:00:57
po_box	4170	string	contact	f	1	2026-08-04 09:01:43
prices_include_vat	1	bool	services	f	\N	2026-08-04 07:12:30
rccm		string	contact	f	\N	2026-08-04 07:12:30
reminder_days	3	int	notif	f	\N	2026-08-04 07:12:30
required_fields	["client_name","client_email","attendees","client_phone"]	json	resa	f	1	2026-08-04 11:52:31
review_form_open	1	bool	site	f	\N	2026-08-04 07:12:30
review_request_days	2	int	notif	f	\N	2026-08-04 07:12:30
reviews_count	6	int	site	f	\N	2026-08-04 07:12:30
reviews_min_rating	4	int	site	f	\N	2026-08-04 07:12:30
seo_description	Test Réservation de salles de conférence et d'événements à Yaoundé. Devis en 24 h.	string	marque	f	1	2026-08-04 09:30:31
show_legal_footer	1	bool	contact	f	\N	2026-08-04 10:35:09
site_name	NetandProEvents CM	string	marque	f	1	2026-08-04 09:06:49
smtp_from_name	NetandProEvents	string	notif	f	\N	2026-08-04 07:12:30
smtp_host	smtp.gmail.com	string	notif	f	\N	2026-08-04 07:12:30
smtp_pass	hlitbmtagkcugrta	string	notif	t	1	2026-08-04 13:33:48
smtp_port	587	int	notif	f	\N	2026-08-04 07:12:30
smtp_reply_to	pinguetn23@gmail.com	string	notif	f	1	2026-08-04 13:09:19
smtp_user	pinguetn23@gmail.com	string	notif	f	1	2026-08-04 13:09:19
social_facebook	netandpro	string	contact	f	1	2026-08-04 11:38:05
social_instagram	netandpro	string	contact	f	1	2026-08-04 11:38:05
social_linkedin	félix-tanzi	string	contact	f	1	2026-08-04 11:36:28
social_tiktok	netandpro	string	contact	f	1	2026-08-04 11:38:05
tagline	Test Vos événements, nos salles	string	marque	f	1	2026-08-04 09:21:22
timezone	Africa/Douala	string	marque	f	\N	2026-08-04 07:12:30
vat_rate	19.25	float	services	f	\N	2026-08-04 07:12:30
waitlist_enabled	1	bool	resa	f	\N	2026-08-04 07:12:30
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, category, action, target, detail, status, changes, user_id, actor_name, actor_email, actor_role, ip, user_agent, method, path, http_status, created_at) FROM stdin;
4	acces	Connexion réussie	Console admin	\N	succes	null	1	Felix TANZI	tanzifelix@gmail.com	super_admin	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 14:59:26
5	acces	Connexion réussie	Console admin	\N	succes	null	1	Felix TANZI	tanzifelix@gmail.com	super_admin	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 15:12:45
7	acces	Connexion réussie	Console admin	\N	succes	null	1	Felix TANZI	tanzifelix@gmail.com	super_admin	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 15:51:28
8	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 15:53:59
9	acces	Connexion réussie	Console admin	\N	succes	null	1	Felix TANZI	tanzifelix@gmail.com	super_admin	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 15:54:54
10	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 15:57:41
11	acces	Connexion réussie	Console admin	\N	succes	null	1	Felix TANZI	tanzifelix@gmail.com	super_admin	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-04 15:58:39
12	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-05 07:11:28
13	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-05 11:23:09
14	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-05 13:09:39
15	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-05 13:09:53
16	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-05 15:33:01
17	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-06 06:54:25
18	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-06 06:56:03
19	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-06 07:45:40
20	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-06 07:54:18
21	resa	Demande de réservation créée	\N	Refusé par le serveur (HTTP 422)	echec	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	422	2026-08-06 07:55:12
22	resa	Demande de réservation créée	\N	\N	succes	null	\N	\N	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/events	201	2026-08-06 08:36:11
23	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-06 08:41:07
24	acces	Connexion réussie	Console admin	\N	succes	null	3	Andre	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-06 09:17:07
25	resa	Dossier confirmé	Réservation #24 — Hilton Yaoundé - Bete A	Passage de « En attente » à « Confirmé »	succes	[{"key": "status", "after": "Confirmé", "before": "En attente"}]	3	\N	nzikofelix@gmail.com	superviseur	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	PATCH	/api/events/24/status	200	2026-08-06 09:53:36
26	acces	Connexion réussie	Console admin	\N	succes	null	1	Felix TANZI	tanzifelix@gmail.com	super_admin	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	POST	/api/auth/login	200	2026-08-06 09:54:16
\.


--
-- Data for Name: business_hours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_hours (weekday, is_open, open_at, close_at) FROM stdin;
0	f	10:00:00	18:00:00
1	t	08:00:00	19:00:00
2	t	08:00:00	19:00:00
3	t	08:00:00	19:00:00
4	f	08:00:00	19:00:00
5	t	08:00:00	21:00:00
6	f	09:00:00	22:00:00
\.


--
-- Data for Name: closures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.closures (id, label, date_from, date_to, kind, created_at) FROM stdin;
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, name, email, phone, subject, message, status, created_at, replied_at, read_at) FROM stdin;
1	Felix Tz	tanzifelix@gmail.com	+237698200792	Test d'envoi de message	Ceci est un message de test pour vérifier que le système d'envoi d'email fonctionne correctement. Si je reçois ce message, tout est opérationnel !	nouveau	2025-10-19 09:44:39	\N	\N
2	NGOUPEYOU	bryan@gmail.com	655123456	y a pas de sujet	non plus de message	nouveau	2025-10-21 13:07:09	\N	\N
3	NGOUPEYOU	jeanngoupeyou9@gmail.com	\N	y a pas de sujet	non plus de message	nouveau	2025-10-21 13:08:34	\N	\N
4	NGOUPEYOU	jeanngoupeyou9@gmail.com	\N	y a pas de sujet	non plus de message	nouveau	2025-10-21 13:08:40	\N	\N
5	NGOUPEYOU	jeanngoupeyou9@gmail.com	\N	y a pas de sujet	non plus de message	nouveau	2025-10-21 13:12:38	\N	\N
6	NZIKO Felix	tanzifelix@gmail.com	+237 698200792	Demande d'information	Bonjour NetandPro Systems,\n\nComment pouvons nous faire une reservation au sein de vos locaux ? En combien de temps traitez-vous une demande ?	nouveau	2025-10-26 20:33:38	\N	\N
7	Felix NZIKO	tanzifelix@gmail.com	+237698200792	Test envoie admin	test et tout putr voir	traite	2026-08-03 13:55:32	2026-08-03 14:15:56	2026-08-03 14:12:42
\.


--
-- Data for Name: email_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_log (id, kind, event_id, recipient, status, detail, created_at) FROM stdin;
1	test	\N	tanzifelix@gmail.com	envoye	\N	2026-08-04 13:34:07
2	ack	24	tanzifelix@gmail.com	envoye	\N	2026-08-06 08:36:16
3	internal_new	24	tanzifelix@gmail.com	envoye	\N	2026-08-06 08:36:20
4	confirm	24	tanzifelix@gmail.com	envoye	\N	2026-08-06 09:53:36
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_templates (key, label, subject, body, is_active, updated_at) FROM stdin;
ack	Accusé de réception	Votre demande a bien été reçue — {{site_name}}	Bonjour {{client_name}},\n\nNous avons bien reçu votre demande pour {{event_title}} du {{date_start}}. Notre équipe revient vers vous sous 24 heures.	t	2026-08-04 07:12:30
cancel	Notification d'annulation	Annulation de votre réservation — {{event_title}}	Bonjour {{client_name}},\n\nVotre réservation du {{date_start}} a été annulée.	t	2026-08-04 07:12:30
confirm	Confirmation de réservation	Réservation confirmée — {{event_title}}	Bonjour {{client_name}},\n\nVotre réservation est confirmée : {{location_name}}, du {{date_start}} au {{date_end}}.	t	2026-08-04 07:12:30
remind	Rappel avant l'événement	Votre événement approche — {{event_title}}	Bonjour {{client_name}},\n\nRappel : votre événement se tient le {{date_start}} à {{location_name}}.	t	2026-08-04 07:12:30
reply	Réponse à un message	Réponse à votre message — {{site_name}}	Bonjour {{client_name}},\n\n{{reply_body}}	f	2026-08-04 07:12:30
review	Demande d'avis	Votre avis sur {{event_title}}	Bonjour {{client_name}},\n\nMerci de votre confiance. Votre avis nous aiderait beaucoup : {{review_link}}	t	2026-08-04 07:12:30
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, client_name, title, client_email, client_phone, company_name, date_start, date_end, location_id, services, payment_method, conditions_accepted, status, is_waitlisted, notes, created_at, attendees, updated_at) FROM stdin;
1	Felix NZIKO	\N	nzikofelix@gmail.com	+237650008676	\N	2025-10-16 10:00:00	2025-10-16 12:00:00	10	["Interprétation simultanée à distance", "Éclairage", "Vidéo & projection"]	Espèces	t	En attente	f	\N	2025-10-04 05:00:26	\N	2026-08-03 12:04:44
2	ygffhv	\N	abraham@gmail.com	+237698273546	\N	2025-10-09 14:09:00	2025-10-10 14:09:00	8	["Tourguide", "Éclairage", "Captation vidéo"]	Espèces	t	Annulé	f	\N	2025-10-08 14:13:17	\N	2026-08-03 12:04:44
3	TANZI Félix	\N	tanzifelix@gmail.com	+237698200792	\N	2025-10-12 17:45:00	2025-10-13 17:45:00	8	["Traduction simultanée", "Sonorisation", "Écran géant", "Microphone de table", "Interprétation escorte mobile", "Copieur N/B", "Imprimantes", "Ordinateur", "Assistance"]	Virement bancaire	t	Confirmé	f	NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: NANA Joyce\nTél. contact: \nNombre de personnes: 30\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2025-10-11 18:47:11	\N	2026-08-03 12:04:44
4	Felix NZIKO	\N	kepmefogedeon@gmail.com	+237680211437	\N	2025-10-29 07:44:00	2025-10-30 07:44:00	22	["Sonorisation", "Écran géant", "Zoom intégré", "Zoom à distance", "Imprimantes"]	Virement bancaire	t	Confirmé	f	NUI: \nAdresse: ENSPY\nPersonne à contacter: AKAMBA BIYEME Miguel Alexandro\nTél. contact: +237680211437\nNombre de personnes: 45\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2025-10-28 07:55:37	\N	2026-08-03 12:04:44
5	TCHAMI Jerry	\N	tjerry@gmail.com	+237671517321	\N	2025-10-31 07:56:00	2025-10-31 13:56:00	12	["Traduction simultanée", "Moniteur de contrôle", "Zoom intégré", "Zoom à distance", "Cabine de traduction", "Assistance"]	Chèque	t	Confirmé	f	NUI: \nAdresse: ENSPY\nPersonne à contacter: TCHAMI Jerry\nTél. contact: +237671517321\nNombre de personnes: 33\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2025-10-28 08:04:19	\N	2026-08-03 12:04:44
6	KEPMEFO Gedeon	\N	kepmefogedeon@gmail.com	+237691688910	\N	2025-10-29 08:27:00	2025-10-29 11:27:00	21	["Sonorisation", "Conférence Hybride", "Écran géant", "Caméras Tracking", "Ordinateur", "Secrétariat complet", "Assistance"]	Virement bancaire	t	Confirmé	f	NUI: \nAdresse: ENSPY\nPersonne à contacter: KEPMEFO Gedeon\nTél. contact: +237691688910\nNombre de personnes: 45\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2025-10-28 08:28:14	\N	2026-08-03 12:04:44
7	AKAMBA BIYEME Miguel Alexandro	\N	akambamiguel@gmail.com	+237680211437	\N	2025-11-04 08:30:00	2025-11-06 08:30:00	11	["Traduction simultanée", "Zoom à distance", "Interprétation escorte mobile"]	Chèque	t	Confirmé	f	NUI: \nAdresse: ENSPY\nPersonne à contacter: AKAMBA BIYEME Miguel Alexandro\nTél. contact: +237680211437\nNombre de personnes: 235\nNombre de jours: 2\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2025-10-28 08:31:23	\N	2026-08-03 12:04:44
8	TCHAMI Jerry	\N	tjerry@gmail.com	+237653827467	\N	2025-11-08 08:27:00	2025-11-09 08:27:00	8	["Sonorisation", "Microphone de table", "Cabine de traduction", "Imprimantes"]	Espèces	t	Confirmé	f	NUI: \nAdresse: ENSPY\nPersonne à contacter: TCHAMI Jerry\nTél. contact: +237671517321\nNombre de personnes: 22\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2025-11-02 08:31:25	\N	2026-08-03 12:04:44
9	NONGA Yvan Dimitry	\N	nongayvan@gmail.com	467465876786986878	\N	2025-11-22 08:35:00	2025-11-22 08:37:00	17	["Microphone de table", "Zoom intégré", "Cabine de traduction", "Copieur N/B"]	Virement bancaire	t	Confirmé	f	NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 34\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2025-11-02 08:38:42	\N	2026-08-03 12:04:44
10	NDAM MBOMBO Ramine Delyan	\N	ndamramine@gmail.com	+237696543571	\N	2025-11-18 23:29:00	2025-11-20 23:29:00	10	["Sonorisation", "Cabine de traduction"]	MTN Mobile Money	t	Confirmé	f	NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 32\nNombre de jours: 3\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2025-11-02 23:30:10	\N	2026-08-03 12:04:44
11	NDAM MBOMBO Ramine Delyan	\N	ndamramine@gmail.com	+237696543571	\N	2025-11-30 23:30:00	2025-12-01 23:30:00	21	["Conférence Hybride", "Imprimantes"]	Orange Money	t	Confirmé	f	NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 12\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2025-11-02 23:31:12	\N	2026-08-03 12:04:44
12	NONGA Yvan Dimitry	\N	nongayvan@gmail.com	+237653827467	\N	2025-11-05 23:43:00	2025-11-06 23:43:00	8	["Écran géant", "Gestion complète de l'événement"]	Orange Money	t	En attente	f	NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 3\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2025-11-02 23:44:08	\N	2026-08-03 12:04:44
13	Pingue TN23	\N	pinguetn23@gmail.com	698200793	\N	2026-07-30 15:38:00	2026-07-30 15:38:00	10	["Sonorisation", "Microphone de table", "Moniteur de contrôle", "Zoom intégré", "Zoom à distance", "Cabine de traduction", "Copieur N/B", "Imprimantes"]	Orange Money	t	Confirmé	f	NUI: \nAdresse: tanzifelix@gmail.com\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 679\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2026-07-23 15:39:51	\N	2026-08-03 12:04:44
14	NDAM MBOMBO Ramine Delyan	\N	ndamramine@gmail.com	+237696543571	\N	2026-07-24 08:46:00	2026-07-24 08:46:00	6	["Conférence Hybride", "Moniteur de contrôle", "Gestion complète de l'événement"]	MTN Mobile Money	t	Confirmé	f	NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 2\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2026-07-24 08:47:38	230	2026-08-03 12:04:45
15	TCHAMI Jerry	\N	tjerry@gmail.com	+237671517321	\N	2026-07-25 08:57:00	2026-07-25 08:57:00	10	["Traduction simultanée", "Écran géant", "Microphone de table", "Cabine de traduction", "Secrétariat complet"]	Espèces	t	Confirmé	f	NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 56\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: Test information	2026-07-24 09:13:03	\N	2026-08-03 12:04:44
16	TCHAMI Jerry	\N	tjerry@gmail.com	+237698200792	\N	2026-07-26 09:26:00	2026-07-31 09:26:00	13	["Conférence Hybride", "Moniteur de contrôle", "Interprétation escorte mobile", "Imprimantes"]	Virement bancaire	t	Confirmé	f	NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 67\nNombre de jours: 6\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2026-07-24 09:27:13	\N	2026-08-03 12:04:44
17	TCHAMI Jerry	\N	tjerry@gmail.com	+237671517321	\N	2026-07-29 10:00:00	2026-07-31 10:00:00	11	["Sonorisation", "Écran géant", "Moniteur de contrôle", "Cabine de traduction", "Interprétation escorte mobile", "Copieur N/B", "Imprimantes", "Gestion complète de l'événement"]	Espèces	t	Confirmé	f	NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: NDAM MBOMBO Ramine Delyan\nTél. contact: +237696543571\nNombre de personnes: 45\nNombre de jours: 3\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: 	2026-07-24 10:01:24	\N	2026-08-03 12:04:44
18	TCHAMI Jerry	\N	tjerry@gmail.com	+237698747478	\N	2026-08-01 14:04:00	2026-08-02 14:04:00	19	["Écran géant", "Microphone de table", "Interprétation escorte mobile", "Copieurs couleur"]	Orange Money	t	En attente	f	NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 80\nNombre de jours: 2\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2026-07-24 15:16:48	\N	2026-08-03 12:04:44
19	NDAM MBOMBO Ramine Delyan	\N	ndamramine@gmail.com	+237698398473	\N	2026-07-31 12:57:00	2026-08-02 12:57:00	21	["Sonorisation", "Conférence Hybride", "Zoom intégré", "Interprétation escorte mobile", "Copieur N/B", "Secrétariat complet"]	Espèces	t	En attente	f	NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 43\nNombre de jours: 3\nConditions de paiement: 50% à la commande, 50% avant l'événement\n\nNotes: test	2026-07-29 12:58:16	\N	2026-08-03 12:04:44
20	Test Bro	\N	ndamramine@gmail.com	+237696543571	VBSHjdk	2026-08-07 13:00:00	2026-08-19 13:00:00	4	["Conférence Hybride", "Écran géant", "Microphone de table", "Caméras Tracking", "Interprétation escorte mobile", "Copieurs couleur", "Imprimantes"]	MTN Mobile Money	t	En attente	f	NUI: 6784908343358\nAdresse: jsdkbkbsfbsf\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 389\nNombre de jours: 13\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2026-07-29 13:01:34	500	2026-08-03 12:04:45
24	NZIKO Felix	Conference snh	tanzifelix@gmail.com	+237698200792	\N	2026-08-21 08:35:00	2026-08-21 14:35:00	5	["Conférence Hybride", "Interprétation escorte mobile"]	MTN Mobile Money	t	Confirmé	f	NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NZIKO Felix\nTél. contact: \nNombre de personnes: 49\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l'événement\n\nNotes: 	2026-08-06 08:36:10	49	2026-08-06 09:53:30
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, name, parent_id, created_at, description, status, updated_at, type, address, city, quartier, latitude, longitude, contact_name, contact_phone, contact_email, website, logo_url, capacity, surface, floor, layouts, equipment, price_per_day, currency, is_bookable, plan_url) FROM stdin;
1	Hilton Yaoundé	\N	2025-10-04 02:54:15	\N	actif	2026-08-03 10:59:09	Hôtel	\N	Yaoundé	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
13	LAGON Club de Yaoundé	\N	2025-10-04 02:54:15	\N	actif	2026-08-03 10:59:09	Club privé	\N	Yaoundé	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
17	Palais des Congrès de Yaoundé	\N	2025-10-04 02:54:15	\N	actif	2026-08-03 10:59:09	Centre de congrès	\N	Yaoundé	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
19	Hôtel Mont Fébé	\N	2025-10-04 02:54:15	\N	actif	2026-08-03 10:59:09	Hôtel	\N	Yaoundé	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
22	Hôtel Starland	\N	2025-10-04 02:54:15	\N	actif	2026-08-03 10:59:09	Hôtel	\N	Yaoundé	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
2	Bouma A	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.296	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
3	Bouma B	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.304	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
4	Bouma C	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.311	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	500	780.00	10	[]	[]	13000000.00	XAF	t	\N
5	Bete A	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.318	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	400	780.00	10	[]	[]	1200000.00	XAF	t	\N
6	Bete B	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.326	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	230	679.00	9	[]	[]	789263.00	XAF	t	\N
7	Bete C	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.333	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
8	Mont Bamboutos	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.341	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
9	Mont Kenya	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.348	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
10	Mont Cameroun	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.357	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
11	Mont Kilimandjaro	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.365	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
12	Doussie	1	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.372	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
14	Salle de conférence	13	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.379	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
15	Salle de réunion 1	13	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.388	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
16	Salle de réunion 2	13	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.395	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
18	Grande salle de conférence	17	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.402	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
20	Salle de conférence	19	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
21	Salle de réunion	19	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.419	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
23	Salle de conférence	22	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.426	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
24	Salle de réunion	22	2025-10-04 02:54:15	\N	actif	2026-08-06 10:29:10.434	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	null	\N	XAF	t	\N
\.


--
-- Data for Name: maintenance_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_log (id, action, detail, status, user_id, created_at) FROM stdin;
1	sauvegarde	netandpro-2026-08-04T07-40-08.sql (42 Ko) — automatique	succes	\N	2026-08-04 07:40:08
2	test_email	Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-47fd4068fb7sm42661420f8f.0 - gsmtp	echec	1	2026-08-04 09:18:43
3	sauvegarde	netandpro-2026-08-04T09-36-39.sql (43 Ko) — automatique	succes	\N	2026-08-04 09:36:39
4	sauvegarde	netandpro-2026-08-04T09-40-04.sql (43 Ko) — automatique	succes	\N	2026-08-04 09:40:05
5	sauvegarde	netandpro-2026-08-04T09-57-27.sql (43 Ko) — automatique	succes	\N	2026-08-04 09:57:38
6	sauvegarde	netandpro-2026-08-04T10-10-41.sql (43 Ko) — automatique	succes	\N	2026-08-04 10:10:41
7	sauvegarde	netandpro-2026-08-04T10-17-18.sql (43 Ko) — automatique	succes	\N	2026-08-04 10:17:19
8	sauvegarde	netandpro-2026-08-04T10-38-44.sql (44 Ko) — automatique	succes	\N	2026-08-04 10:38:44
9	sauvegarde	netandpro-2026-08-04T11-09-50.sql (44 Ko) — automatique	succes	\N	2026-08-04 11:09:53
10	sauvegarde	netandpro-2026-08-04T11-33-03.sql (44 Ko) — automatique	succes	\N	2026-08-04 11:33:03
11	sauvegarde	netandpro-2026-08-04T11-47-30.sql (44 Ko) — manuelle	succes	1	2026-08-04 11:47:30
12	sauvegarde	netandpro-2026-08-04T12-46-29.sql (44 Ko) — automatique	succes	\N	2026-08-04 12:46:30
13	sauvegarde	netandpro-2026-08-04T12-50-08.sql (44 Ko) — automatique	succes	\N	2026-08-04 12:50:08
14	sauvegarde	netandpro-2026-08-04T12-50-49.sql (45 Ko) — automatique	succes	\N	2026-08-04 12:50:49
15	sauvegarde	netandpro-2026-08-04T12-53-08.sql (44 Ko) — automatique	succes	\N	2026-08-04 12:53:08
16	test_email	Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 5b1f17b1804b1-49949fc7047sm93211515e9.3 - gsmtp	echec	1	2026-08-04 12:57:31
17	test_email	envoyé à tanzifelix@gmail.com	succes	1	2026-08-04 13:10:57
18	test_email	envoyé à tanzifelix@gmail.com	succes	1	2026-08-04 13:11:14
19	sauvegarde	netandpro-2026-08-04T13-17-15.sql (46 Ko) — automatique	succes	\N	2026-08-04 13:17:16
20	sauvegarde	netandpro-2026-08-04T13-20-09.sql (46 Ko) — automatique	succes	\N	2026-08-04 13:20:09
21	sauvegarde	netandpro-2026-08-04T13-22-42.sql (46 Ko) — automatique	succes	\N	2026-08-04 13:22:42
22	sauvegarde	netandpro-2026-08-04T13-22-52.sql (46 Ko) — automatique	succes	\N	2026-08-04 13:22:53
23	sauvegarde	netandpro-2026-08-04T13-23-23.sql (46 Ko) — automatique	succes	\N	2026-08-04 13:23:23
24	sauvegarde	netandpro-2026-08-04T13-28-38.sql (47 Ko) — automatique	succes	\N	2026-08-04 13:28:38
25	sauvegarde	netandpro-2026-08-04T13-34-03.sql (47 Ko) — automatique	succes	\N	2026-08-04 13:34:03
26	test_email	envoyé à tanzifelix@gmail.com	succes	1	2026-08-04 13:34:07
27	sauvegarde	netandpro-2026-08-04T13-48-59.sql (47 Ko) — automatique	succes	\N	2026-08-04 13:48:59
28	sauvegarde	netandpro-2026-08-04T13-50-49.sql (47 Ko) — automatique	succes	\N	2026-08-04 13:50:49
29	sauvegarde	netandpro-2026-08-04T14-14-13.sql (47 Ko) — automatique	succes	\N	2026-08-04 14:14:14
30	sauvegarde	netandpro-2026-08-04T14-45-06.sql (49 Ko) — automatique	succes	\N	2026-08-04 14:45:08
31	sauvegarde	netandpro-2026-08-04T14-46-46.sql (49 Ko) — automatique	succes	\N	2026-08-04 14:46:47
32	sauvegarde	netandpro-2026-08-04T14-47-21.sql (49 Ko) — automatique	succes	\N	2026-08-04 14:47:22
33	sauvegarde	netandpro-2026-08-04T14-49-21.sql (49 Ko) — automatique	succes	\N	2026-08-04 14:49:21
34	sauvegarde	netandpro-2026-08-04T14-50-28.sql (49 Ko) — automatique	succes	\N	2026-08-04 14:50:29
35	sauvegarde	netandpro-2026-08-04T14-51-00.sql (50 Ko) — automatique	succes	\N	2026-08-04 14:51:00
36	sauvegarde	netandpro-2026-08-04T14-59-52.sql (50 Ko) — automatique	succes	\N	2026-08-04 14:59:52
37	sauvegarde	netandpro-2026-08-04T15-13-10.sql (50 Ko) — automatique	succes	\N	2026-08-04 15:13:11
38	sauvegarde	netandpro-2026-08-04T15-18-38.sql (51 Ko) — automatique	succes	\N	2026-08-04 15:18:39
39	sauvegarde	netandpro-2026-08-04T15-19-44.sql (51 Ko) — automatique	succes	\N	2026-08-04 15:19:44
40	sauvegarde	netandpro-2026-08-04T15-30-35.sql (51 Ko) — automatique	succes	\N	2026-08-04 15:30:35
41	sauvegarde	netandpro-2026-08-04T15-31-39.sql (52 Ko) — automatique	succes	\N	2026-08-04 15:31:39
42	sauvegarde	netandpro-2026-08-04T15-51-52.sql (52 Ko) — automatique	succes	\N	2026-08-04 15:51:52
43	sauvegarde	netandpro-2026-08-05T07-10-11.sql (53 Ko) — automatique	succes	\N	2026-08-05 07:10:12
44	sauvegarde	netandpro-2026-08-05T07-46-52.sql (54 Ko) — automatique	succes	\N	2026-08-05 07:46:52
45	sauvegarde	netandpro-2026-08-05T08-20-15.sql (55 Ko) — automatique	succes	\N	2026-08-05 08:20:15
46	sauvegarde	netandpro-2026-08-05T08-21-27.sql (55 Ko) — automatique	succes	\N	2026-08-05 08:21:28
47	sauvegarde	netandpro-2026-08-05T10-51-03.sql (55 Ko) — automatique	succes	\N	2026-08-05 10:51:04
48	sauvegarde	netandpro-2026-08-05T11-42-31.sql (55 Ko) — automatique	succes	\N	2026-08-05 11:42:31
49	sauvegarde	netandpro-2026-08-05T11-43-05.sql (55 Ko) — automatique	succes	\N	2026-08-05 11:43:06
50	sauvegarde	netandpro-2026-08-05T11-44-10.sql (56 Ko) — automatique	succes	\N	2026-08-05 11:44:10
51	sauvegarde	netandpro-2026-08-05T13-08-37.sql (56 Ko) — automatique	succes	\N	2026-08-05 13:08:38
52	sauvegarde	netandpro-2026-08-06T06-49-28.sql (57 Ko) — automatique	succes	\N	2026-08-06 06:49:28
53	sauvegarde	netandpro-2026-08-06T07-43-30.sql (57 Ko) — automatique	succes	\N	2026-08-06 07:43:31
54	sauvegarde	netandpro-2026-08-06T09-36-48.sql (60 Ko) — automatique	succes	\N	2026-08-06 09:36:48
55	sauvegarde	netandpro-2026-08-06T09-40-14.sql (60 Ko) — automatique	succes	\N	2026-08-06 09:40:14
56	sauvegarde	netandpro-2026-08-06T09-58-12.sql (61 Ko) — automatique	succes	\N	2026-08-06 09:58:13
57	sauvegarde	netandpro-2026-08-06T10-00-00.sql (61 Ko) — automatique	succes	\N	2026-08-06 10:00:01
58	sauvegarde	netandpro-2026-08-06T10-04-48.sql (61 Ko) — automatique	succes	\N	2026-08-06 10:04:49
59	sauvegarde	netandpro-2026-08-06T10-07-42.sql (61 Ko) — automatique	succes	\N	2026-08-06 10:07:43
60	sauvegarde	netandpro-2026-08-06T10-08-28.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:08:28
61	sauvegarde	netandpro-2026-08-06T10-11-45.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:11:45
62	sauvegarde	netandpro-2026-08-06T10-12-23.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:12:23
63	sauvegarde	netandpro-2026-08-06T10-13-03.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:13:03
64	sauvegarde	netandpro-2026-08-06T10-13-44.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:13:44
65	sauvegarde	netandpro-2026-08-06T10-16-02.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:16:02
66	sauvegarde	netandpro-2026-08-06T10-18-38.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:18:38
67	sauvegarde	netandpro-2026-08-06T10-21-46.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:21:47
68	sauvegarde	netandpro-2026-08-06T10-22-39.sql (62 Ko) — automatique	succes	\N	2026-08-06 10:22:39
69	sauvegarde	netandpro-2026-08-06T10-24-01.sql (63 Ko) — automatique	succes	\N	2026-08-06 10:24:02
70	sauvegarde	netandpro-2026-08-06T10-27-48.sql (63 Ko) — automatique	succes	\N	2026-08-06 10:27:48
\.


--
-- Data for Name: message_replies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_replies (id, message_id, admin_id, admin_email, body, sent_at) FROM stdin;
1	7	1	tanzifelix@gmail.com	Bonjour Felix, c'est un test d'envoi depuis l'interface pour voir que tout est correct dans l'envoi des mail depuis l'interface	2026-08-03 14:15:56
2	7	1	tanzifelix@gmail.com	test pour message	2026-08-03 14:52:19
3	7	1	tanzifelix@gmail.com	Bonjour Felix,\n\nLa salle souhaitée est malheureusement déjà réservée sur ces dates. Nous pouvons vous proposer des créneaux alternatifs ou une autre salle de capacité équivalente.\n\nCordialement,\nL'équipe NetandProEvents	2026-08-03 14:53:29
\.


--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_codes (id, email, code_hash, expires_at, used, attempts, created_at) FROM stdin;
1	nzikofelix@gmail.com	$2b$10$GQv3GBNjeJrAI4bsxJb4rOkUriZGPq0kDQv0FRfDOAzDxHI3mzgIW	2026-08-06 08:50:21	t	0	2026-08-06 08:40:20
\.


--
-- Data for Name: service_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_catalog (id, name, price, unit, is_active, sort_order, created_at, updated_at) FROM stdin;
1	Sonorisation	150000.00	forfait	t	1	2026-08-04 07:12:30	2026-08-04 07:12:30
2	Vidéoprojection	90000.00	forfait	t	2	2026-08-04 07:12:30	2026-08-04 07:12:30
3	Traiteur	450000.00	par personne	t	3	2026-08-04 07:12:30	2026-08-04 07:12:30
4	Décoration florale	120000.00	forfait	t	4	2026-08-04 07:12:30	2026-08-04 07:12:30
5	Sécurité	200000.00	par jour	t	5	2026-08-04 07:12:30	2026-08-04 07:12:30
6	Captation vidéo	350000.00	forfait	t	6	2026-08-04 07:12:30	2026-08-04 07:12:30
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, client_name, comment, created_at, rating, status, is_featured, keep_forever, event_id, client_email, moderated_at, moderated_by) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, password_expiration, created_at, name, phone, role, is_active, twofa_enabled, must_change_password, last_login_at, created_by, updated_at) FROM stdin;
1	tanzifelix@gmail.com	$2a$10$ftu0176ujiDMAsQgCKi8yeHqjXpDtQO3EGBkABlcfrCSSekf1e5YS	2026-10-22	2025-10-04 02:54:15	Felix TANZI	\N	super_admin	t	f	f	2026-08-06 09:54:16	\N	2026-08-06 09:54:16
2	felixtz@gmail.com	$2b$10$KUpKwAuZsSmFAgWzIVOFuu6DHcODfN1ZUMpw2QB.JYU08JpgpFqx2	2026-08-10	2026-08-04 06:04:49	Felix TZ	+237698200792	superviseur	t	f	t	\N	1	2026-08-06 10:29:10.276
3	nzikofelix@gmail.com	$2b$10$wZlWwEreKBuEUuzoBoympOdeaoUksh3r9jvuOqTO9NKdioTMIPQDq	2026-11-03	2026-08-04 06:06:20	Andre	+237698200792	superviseur	t	f	t	2026-08-06 09:17:07	1	2026-08-06 10:29:10.288
4	admin@netandpro.cm	$2b$10$0zM9/lwORI/RmNJsJVOJR.w8xjLNMhFy74yZ6iFRUgyf/pm7PnKpC	2026-11-03	2026-08-06 10:29:23.338	Administrateur NetandPro	\N	super_admin	t	f	t	\N	\N	2026-08-06 10:29:23.338
5	superviseur@netandpro.cm	$2b$10$3CcMWhqd7mTuL1m9G3DFkeIAtuoZZ7IApa7Lmtep0nwNtNFGNBLuu	2026-11-03	2026-08-06 10:29:23.553	Superviseur NetandPro	\N	superviseur	t	f	t	\N	\N	2026-08-06 10:29:23.553
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 26, true);


--
-- Name: closures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.closures_id_seq', 1, false);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 7, true);


--
-- Name: email_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_log_id_seq', 4, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 24, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_id_seq', 24, true);


--
-- Name: maintenance_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_log_id_seq', 70, true);


--
-- Name: message_replies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.message_replies_id_seq', 3, true);


--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_codes_id_seq', 1, true);


--
-- Name: service_catalog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_catalog_id_seq', 6, true);


--
-- Name: testimonials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.testimonials_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: business_hours business_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_hours
    ADD CONSTRAINT business_hours_pkey PRIMARY KEY (weekday);


--
-- Name: closures closures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closures
    ADD CONSTRAINT closures_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: email_log email_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_log
    ADD CONSTRAINT email_log_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (key);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: maintenance_log maintenance_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_log
    ADD CONSTRAINT maintenance_log_pkey PRIMARY KEY (id);


--
-- Name: message_replies message_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_replies
    ADD CONSTRAINT message_replies_pkey PRIMARY KEY (id);


--
-- Name: password_reset_codes password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id);


--
-- Name: service_catalog service_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_catalog
    ADD CONSTRAINT service_catalog_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: app_settings_group_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX app_settings_group_key_idx ON public.app_settings USING btree (group_key);


--
-- Name: app_settings_updated_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX app_settings_updated_by_idx ON public.app_settings USING btree (updated_by);


--
-- Name: audit_log_category_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_category_created_at_idx ON public.audit_log USING btree (category, created_at);


--
-- Name: audit_log_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_created_at_idx ON public.audit_log USING btree (created_at);


--
-- Name: audit_log_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_user_id_created_at_idx ON public.audit_log USING btree (user_id, created_at);


--
-- Name: closures_date_from_date_to_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX closures_date_from_date_to_idx ON public.closures USING btree (date_from, date_to);


--
-- Name: contact_messages_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_messages_created_at_idx ON public.contact_messages USING btree (created_at);


--
-- Name: contact_messages_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_messages_email_idx ON public.contact_messages USING btree (email);


--
-- Name: contact_messages_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_messages_status_idx ON public.contact_messages USING btree (status);


--
-- Name: email_log_kind_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_log_kind_created_at_idx ON public.email_log USING btree (kind, created_at);


--
-- Name: events_client_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_client_email_idx ON public.events USING btree (client_email);


--
-- Name: events_date_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_date_start_idx ON public.events USING btree (date_start);


--
-- Name: events_location_id_is_waitlisted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_location_id_is_waitlisted_idx ON public.events USING btree (location_id, is_waitlisted);


--
-- Name: events_status_date_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_status_date_start_idx ON public.events USING btree (status, date_start);


--
-- Name: locations_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_parent_id_idx ON public.locations USING btree (parent_id);


--
-- Name: locations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_status_idx ON public.locations USING btree (status);


--
-- Name: maintenance_log_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maintenance_log_action_created_at_idx ON public.maintenance_log USING btree (action, created_at);


--
-- Name: maintenance_log_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maintenance_log_user_id_idx ON public.maintenance_log USING btree (user_id);


--
-- Name: message_replies_admin_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_replies_admin_id_idx ON public.message_replies USING btree (admin_id);


--
-- Name: message_replies_message_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_replies_message_id_idx ON public.message_replies USING btree (message_id);


--
-- Name: password_reset_codes_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_codes_email_idx ON public.password_reset_codes USING btree (email);


--
-- Name: password_reset_codes_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_codes_expires_at_idx ON public.password_reset_codes USING btree (expires_at);


--
-- Name: testimonials_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonials_event_id_idx ON public.testimonials USING btree (event_id);


--
-- Name: testimonials_is_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonials_is_featured_idx ON public.testimonials USING btree (is_featured);


--
-- Name: testimonials_moderated_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonials_moderated_by_idx ON public.testimonials USING btree (moderated_by);


--
-- Name: testimonials_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonials_status_idx ON public.testimonials USING btree (status);


--
-- Name: uniq_name_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_name_parent ON public.locations USING btree (parent_id, name);


--
-- Name: uq_kind_event; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_kind_event ON public.email_log USING btree (kind, event_id);


--
-- Name: uq_service_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_service_name ON public.service_catalog USING btree (name);


--
-- Name: users_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_created_by_idx ON public.users USING btree (created_by);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_active_idx ON public.users USING btree (is_active);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: app_settings app_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: events events_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: locations locations_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maintenance_log maintenance_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_log
    ADD CONSTRAINT maintenance_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: message_replies message_replies_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_replies
    ADD CONSTRAINT message_replies_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: message_replies message_replies_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_replies
    ADD CONSTRAINT message_replies_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.contact_messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: testimonials testimonials_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: testimonials testimonials_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 0gaG6cd5EV4N3SEq0jXzyxRpiP9EHu5C7TD6RTWhsant4PLvINb8Ydko0ZKth3J

