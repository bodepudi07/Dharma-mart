-- ============================================================
-- Dharma Mart — Initial Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null unique,
  password    text not null,
  role        text not null default 'user' check (role in ('user', 'admin', 'vendor')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- VENDORS
-- ============================================================
create table if not exists vendors (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text unique,
  email               text not null unique,
  phone               text,
  alternate_phone     text,
  description         text,
  logo_url            text,
  logo_public_id      text,
  banner_url          text,
  banner_public_id    text,
  -- Address
  street              text,
  city                text,
  state               text,
  country             text default 'India',
  zip_code            text,
  latitude            numeric,
  longitude           numeric,
  -- Business
  business_name       text,
  business_type       text check (business_type in ('individual','partnership','company','llp','other')),
  gst_number          text,
  pan_number          text,
  registration_number text,
  established_year    int,
  -- Bank
  account_holder_name text,
  account_number      text,
  bank_name           text,
  ifsc_code           text,
  branch_name         text,
  upi_id              text,
  -- Settings
  commission          numeric default 10,
  commission_type     text default 'percentage' check (commission_type in ('percentage','fixed')),
  website             text,
  -- Ratings
  ratings_average     numeric default 0,
  ratings_count       int default 0,
  -- Status
  status              text default 'pending' check (status in ('pending','approved','rejected','suspended','inactive')),
  is_verified         boolean default false,
  -- Stats
  total_sales         numeric default 0,
  total_orders        int default 0,
  total_products      int default 0,
  total_revenue       numeric default 0,
  notes               text,
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null unique,
  description       text,
  slug              text unique,
  image_url         text,
  image_public_id   text,
  parent_id         uuid references categories(id) on delete set null,
  is_active         boolean default true,
  sort_order        int default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  description           text not null,
  short_description     text,
  slug                  text unique,
  sku                   text unique,
  price                 numeric not null,
  compare_price         numeric,
  cost_price            numeric,
  currency              text default 'INR',
  category_id           uuid references categories(id) on delete set null,
  subcategory_id        uuid references categories(id) on delete set null,
  vendor_id             uuid references vendors(id) on delete set null,
  brand                 text,
  -- Thumbnail
  thumbnail_url         text,
  thumbnail_public_id   text,
  -- Stock
  stock_quantity        int default 0,
  low_stock_threshold   int default 10,
  track_inventory       boolean default true,
  allow_backorder       boolean default false,
  -- Weight/Dimensions
  weight_value          numeric,
  weight_unit           text default 'g' check (weight_unit in ('g','kg','lb','oz')),
  length                numeric,
  width                 numeric,
  height                numeric,
  dimension_unit        text default 'cm' check (dimension_unit in ('cm','in','mm')),
  -- Tags & Attributes stored as JSONB
  tags                  jsonb default '[]',
  attributes            jsonb default '[]',
  custom_fields         jsonb default '{}',
  variants              jsonb default '[]',
  -- SEO
  seo_title             text,
  seo_description       text,
  seo_keywords          jsonb default '[]',
  -- Ratings
  ratings_average       numeric default 0,
  ratings_count         int default 0,
  -- Shipping
  is_free_shipping      boolean default false,
  shipping_class        text,
  estimated_delivery    text,
  -- Status flags
  status                text default 'draft' check (status in ('draft','active','inactive','out_of_stock','discontinued')),
  is_featured           boolean default false,
  is_new_arrival        boolean default false,
  is_best_seller        boolean default false,
  published_at          timestamptz,
  sale_start_date       timestamptz,
  sale_end_date         timestamptz,
  metadata              jsonb default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Product images (one-to-many)
create table if not exists product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  public_id   text,
  alt         text,
  is_primary  boolean default false,
  sort_order  int default 0
);

-- Product reviews (one-to-many)
create table if not exists product_reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- CARTS
-- ============================================================
create table if not exists carts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references users(id) on delete cascade,
  session_id    text,
  subtotal      numeric default 0,
  total_items   int default 0,
  -- Coupon
  coupon_code       text,
  coupon_discount_type  text check (coupon_discount_type in ('percentage','fixed')),
  coupon_discount_value numeric,
  coupon_discount_amount numeric,
  is_active     boolean default true,
  expires_at    timestamptz default (now() + interval '30 days'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists cart_items (
  id          uuid primary key default uuid_generate_v4(),
  cart_id     uuid not null references carts(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  quantity    int not null check (quantity >= 1),
  price       numeric not null,
  variant     jsonb,
  added_at    timestamptz default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id                  uuid primary key default uuid_generate_v4(),
  order_number        text not null unique,
  user_id             uuid references users(id) on delete set null,
  guest_email         text,
  -- Shipping address
  shipping_full_name  text not null,
  shipping_phone      text not null,
  shipping_email      text,
  shipping_street     text not null,
  shipping_city       text not null,
  shipping_state      text not null,
  shipping_country    text default 'India',
  shipping_zip_code   text not null,
  shipping_landmark   text,
  shipping_address_type text default 'home' check (shipping_address_type in ('home','work','other')),
  -- Billing (same fields)
  billing_full_name   text,
  billing_phone       text,
  billing_email       text,
  billing_street      text,
  billing_city        text,
  billing_state       text,
  billing_country     text,
  billing_zip_code    text,
  -- Payment
  payment_method      text not null check (payment_method in ('cashfree','cod','wallet','upi')),
  payment_status      text default 'pending' check (payment_status in ('pending','processing','completed','failed','refunded','partially_refunded')),
  payment_transaction_id    text,
  cashfree_order_id         text,
  cashfree_payment_id       text,
  payment_amount      numeric not null,
  payment_currency    text default 'INR',
  paid_at             timestamptz,
  refund_amount       numeric,
  refund_reason       text,
  refunded_at         timestamptz,
  -- Totals
  subtotal            numeric not null,
  tax_amount          numeric default 0,
  shipping_cost       numeric default 0,
  discount_amount     numeric default 0,
  discount_code       text,
  discount_type       text check (discount_type in ('percentage','fixed')),
  total_amount        numeric not null,
  -- Status
  status              text default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','returned','refunded')),
  -- Tracking
  tracking_carrier    text,
  tracking_number     text,
  tracking_url        text,
  estimated_delivery  timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  -- Notes
  customer_note       text,
  internal_note       text,
  -- Cancellation
  cancellation_reason text,
  cancelled_by        uuid references users(id) on delete set null,
  cancelled_at        timestamptz,
  refund_status       text check (refund_status in ('pending','processed','failed')),
  -- Return
  return_reason       text,
  return_requested_at timestamptz,
  return_approved_at  timestamptz,
  return_status       text check (return_status in ('requested','approved','rejected','picked_up','received','refunded')),
  -- Invoice
  invoice_number      text,
  invoice_generated_at timestamptz,
  invoice_url         text,
  -- Meta
  source              text default 'web' check (source in ('web','mobile','admin','api')),
  ip_address          text,
  user_agent          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  vendor_id   uuid references vendors(id) on delete set null,
  name        text not null,
  sku         text,
  quantity    int not null check (quantity >= 1),
  price       numeric not null,
  total_price numeric not null,
  image_url   text,
  image_public_id text,
  variant     jsonb
);

create table if not exists order_status_history (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  status      text not null,
  note        text,
  updated_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_vendor on products(vendor_id);
create index if not exists idx_products_featured on products(is_featured);
create index if not exists idx_products_new_arrival on products(is_new_arrival);
create index if not exists idx_products_best_seller on products(is_best_seller);
create index if not exists idx_products_created on products(created_at desc);

create index if not exists idx_carts_user on carts(user_id);
create index if not exists idx_carts_session on carts(session_id);
create index if not exists idx_cart_items_cart on cart_items(cart_id);

create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_payment_status on orders(payment_status);
create index if not exists idx_orders_cashfree_id on orders(cashfree_order_id);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);

create index if not exists idx_reviews_product on product_reviews(product_id);
create index if not exists idx_images_product on product_images(product_id);

create index if not exists idx_vendors_status on vendors(status);
create index if not exists idx_categories_parent on categories(parent_id);
