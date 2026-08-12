/**
 * /dev/internal-preview — task P2-08 design-sprint prototype (noindex, dev-only).
 *
 * Renders the two internal shells and the shared compositions described in
 * INTERNAL-SURFACES-DESIGN, built from the P0-08 design system so what the
 * owner approves is what P3-02 / P4-01 will actually inherit. Static sample
 * data on purpose: this is a design decision surface, not a working console.
 */
import Head from "next/head";
import * as React from "react";
import {
  BarChart3,
  Building2,
  CarFront,
  ChevronLeft,
  CreditCard,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared compositions (§3 of the spec)                                */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-0.5 text-xs font-semibold",
            tone === "up" && "text-success-strong",
            tone === "down" && "text-danger-strong",
            tone === "neutral" && "text-muted",
          )}
        >
          {delta}
        </p>
      )}
    </Card>
  );
}

interface Column {
  key: string;
  label: string;
  align?: "start" | "end";
}

function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  caption: string;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-card">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-brand text-white">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "p-2.5 font-semibold",
                  c.align === "end" ? "text-end" : "text-start",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn("h-10", i % 2 === 1 && "bg-page")}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "border-b border-divider p-2.5 text-ink",
                    c.align === "end" ? "text-end" : "text-start",
                  )}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterBar({ chips }: { chips: string[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="relative">
        <Search
          className="pointer-events-none absolute inset-block-0 start-2 my-auto size-4 text-muted"
          aria-hidden
        />
        <Input className="h-9 w-56 ps-8" placeholder="Search…" readOnly />
      </span>
      {chips.map((chip) => (
        <Badge key={chip} variant="neutral">
          {chip}
        </Badge>
      ))}
      <Button size="sm" variant="outline">
        Filters
      </Button>
    </div>
  );
}

function WorkspaceShell({
  brandLabel,
  brandBadge,
  groups,
  activeItem,
  children,
}: {
  brandLabel: string;
  brandBadge: string;
  groups: { title?: string; items: { label: string; icon: React.ElementType }[] }[];
  activeItem: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[560px] overflow-hidden rounded-panel border border-line bg-page">
      <aside className="hidden w-56 shrink-0 border-e border-line bg-card p-3 md:block">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-extrabold text-brand">{brandLabel}</span>
          <Badge variant="navy">{brandBadge}</Badge>
        </div>
        <nav className="flex flex-col gap-3">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {group.title}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ label, icon: Icon }) => {
                  const active = label === activeItem;
                  return (
                    <li key={label}>
                      <span
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-card px-2 py-1.5 text-[13px]",
                          active
                            ? "bg-brand-surface font-bold text-brand"
                            : "text-ink hover:bg-page",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {label}
                        {active && <span className="ms-auto text-brand">•</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-2.5">
          <p className="text-sm font-bold text-ink">{activeItem}</p>
          <span className="flex items-center gap-2 text-xs text-muted">
            <Badge variant="green">Signed in</Badge>
            EN
          </span>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prototype content                                                   */
/* ------------------------------------------------------------------ */

const DEALER_NAV = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Inventory", icon: CarFront },
      { label: "Leads", icon: Inbox },
      { label: "Messages", icon: MessageCircle },
      { label: "Analytics", icon: BarChart3 },
      { label: "Branches & team", icon: Building2 },
      { label: "Subscription", icon: CreditCard },
    ],
  },
];

const ADMIN_NAV = [
  {
    title: "Operate",
    items: [
      { label: "Moderation", icon: ShieldCheck },
      { label: "Reports queue", icon: Flag },
      { label: "Listings", icon: CarFront },
      { label: "Users", icon: Users },
      { label: "Dealers", icon: Building2 },
    ],
  },
  {
    title: "Commerce",
    items: [
      { label: "Invoices", icon: FileText },
      { label: "Subscriptions", icon: CreditCard },
    ],
  },
  {
    title: "Insight",
    items: [{ label: "Audit log", icon: BarChart3 }],
  },
];

const statusPill = (
  label: string,
  variant: "green" | "amber" | "red" | "neutral" | "navy",
) => (
  <Badge variant={variant}>{label}</Badge>
);

export default function InternalPreviewPage() {
  return (
    <>
      <Head>
        <title>Internal surfaces — design preview</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-extrabold text-ink">
          Internal surfaces — design preview
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Task P2-08. These shells are built from the live design system, so
          approving them approves what P3-02 and P4-01 will inherit. Read this
          next to <span className="font-semibold">INTERNAL-SURFACES-DESIGN</span>{" "}
          and tick the modules you approve.
        </p>

        <Tabs defaultValue="dealer" className="mt-6">
          <TabsList>
            <TabsTrigger value="dealer">Dealer portal</TabsTrigger>
            <TabsTrigger value="admin">Admin workspace</TabsTrigger>
            <TabsTrigger value="parts">Shared parts</TabsTrigger>
          </TabsList>

          {/* ── Dealer ─────────────────────────────────────────────────── */}
          <TabsContent value="dealer" className="mt-4">
            <WorkspaceShell
              brandLabel="carsens."
              brandBadge="Dealer"
              groups={DEALER_NAV}
              activeItem="Inventory"
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Live listings" value="42" delta="of 60 in package" />
                <StatCard label="Leads · 7 days" value="128" delta="+18%" tone="up" />
                <StatCard label="Views · 7 days" value="9,410" delta="+4%" tone="up" />
                <StatCard label="Expiring in 7 days" value="6" delta="renew to keep live" />
              </div>

              <FilterBar chips={["Live", "Dubai", "SUV"]} />

              <DataTable
                caption="Dealer inventory sample"
                columns={[
                  { key: "car", label: "Listing" },
                  { key: "price", label: "Price", align: "end" },
                  { key: "status", label: "Status" },
                  { key: "views", label: "Views", align: "end" },
                  { key: "leads", label: "Leads", align: "end" },
                  { key: "expires", label: "Expires" },
                ]}
                rows={[
                  {
                    car: "2024 Toyota Land Cruiser GR-Sport",
                    price: "AED 355,000",
                    status: statusPill("Live", "green"),
                    views: "1,204",
                    leads: "18",
                    expires: "in 46 days",
                  },
                  {
                    car: "2023 Nissan Patrol LE Titanium",
                    price: "AED 291,000",
                    status: statusPill("In review", "amber"),
                    views: "—",
                    leads: "—",
                    expires: "—",
                  },
                  {
                    car: "2022 BMW X5 xDrive40i",
                    price: "AED 214,500",
                    status: statusPill("Expiring", "amber"),
                    views: "876",
                    leads: "9",
                    expires: "in 3 days",
                  },
                  {
                    car: "2021 Toyota Camry SE",
                    price: "AED 78,000",
                    status: statusPill("Rejected", "red"),
                    views: "—",
                    leads: "—",
                    expires: "—",
                  },
                ]}
              />

              <p className="mt-3 text-xs text-muted">
                Bulk actions appear in a sticky bar once rows are selected, with the
                count announced to screen readers. Filters and page live in the URL,
                so a dealer can send a colleague exactly what they are looking at.
              </p>
            </WorkspaceShell>
          </TabsContent>

          {/* ── Admin ──────────────────────────────────────────────────── */}
          <TabsContent value="admin" className="mt-4">
            <WorkspaceShell
              brandLabel="carsens."
              brandBadge="Admin"
              groups={ADMIN_NAV}
              activeItem="Moderation"
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="In queue" value="37" delta="oldest 4h 12m" />
                <StatCard label="Approved today" value="96" />
                <StatCard label="Rejected today" value="11" />
                <StatCard label="SLA breaches" value="2" delta="over 12h" tone="down" />
              </div>

              <FilterBar chips={["Pending", "Private sellers"]} />

              <DataTable
                caption="Moderation queue sample"
                columns={[
                  { key: "listing", label: "Listing" },
                  { key: "seller", label: "Seller" },
                  { key: "submitted", label: "Submitted" },
                  { key: "photos", label: "Photos", align: "end" },
                  { key: "actions", label: "Actions", align: "end" },
                ]}
                rows={[
                  {
                    listing: "2024 Toyota Land Cruiser GR-Sport",
                    seller: "Private · verified",
                    submitted: "12 min ago",
                    photos: "8",
                    actions: (
                      <span className="flex justify-end gap-1.5">
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </span>
                    ),
                  },
                  {
                    listing: "2019 Nissan Altima SV",
                    seller: "Al Habtoor Motors",
                    submitted: "4h 12m ago",
                    photos: "3",
                    actions: (
                      <span className="flex justify-end gap-1.5">
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </span>
                    ),
                  },
                ]}
              />

              <Panel className="mt-4 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Row detail (expanded)
                </p>
                <div className="mt-2 grid gap-3 md:grid-cols-[160px_1fr]">
                  <div className="aspect-[4/3] rounded-card bg-brand-surface" />
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
                    {[
                      ["Price", "AED 355,000"],
                      ["Mileage", "21,000 km"],
                      ["Regional spec", "GCC"],
                      ["Fuel", "Petrol"],
                      ["Transmission", "Automatic"],
                      ["VIN", "JT••••••••••1234"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-muted">{k}</dt>
                        <dd className="font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="mt-3 text-xs text-muted">
                  Rejection always asks for a reason — it is what the seller sees, and
                  it is written to the audit log with the actor and timestamp.
                </p>
              </Panel>
            </WorkspaceShell>
          </TabsContent>

          {/* ── Shared parts ───────────────────────────────────────────── */}
          <TabsContent value="parts" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel className="p-4">
                <h2 className="text-sm font-bold text-ink">Density comparison</h2>
                <p className="mt-1 text-xs text-muted">
                  Internal surfaces drop one type step and one padding step. Same
                  tokens, more rows per screen.
                </p>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-card border border-line p-5 text-sm">
                    Marketplace density · 14px / p-5
                  </div>
                  <div className="rounded-card border border-line p-3 text-[13px]">
                    Internal density · 13px / p-3
                  </div>
                </div>
              </Panel>

              <Panel className="p-4">
                <h2 className="text-sm font-bold text-ink">Status vocabulary</h2>
                <p className="mt-1 text-xs text-muted">
                  Colour is never the only signal — every pill carries its label.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusPill("Live", "green")}
                  {statusPill("In review", "amber")}
                  {statusPill("Expiring", "amber")}
                  {statusPill("Rejected", "red")}
                  {statusPill("Draft", "neutral")}
                  {statusPill("Sold", "navy")}
                </div>
              </Panel>

              <Panel className="p-4">
                <h2 className="text-sm font-bold text-ink">Empty state</h2>
                <div className="mt-3 flex flex-col items-center gap-2 rounded-card border border-dashed border-line p-8 text-center">
                  <Inbox className="size-7 text-muted" aria-hidden />
                  <p className="text-sm font-bold text-ink">Queue is clear</p>
                  <p className="max-w-xs text-xs text-muted">
                    Nothing is waiting for review. New submissions appear here within
                    seconds.
                  </p>
                </div>
              </Panel>

              <Panel className="p-4">
                <h2 className="text-sm font-bold text-ink">Immutability affordance</h2>
                <p className="mt-1 text-xs text-muted">
                  An issued invoice has no edit control at all — the only path is a
                  credit note (PRD §30.1).
                </p>
                <div className="mt-3 rounded-card border border-line p-3">
                  <p className="flex items-center justify-between text-sm">
                    <span className="font-bold text-ink">INV-2026-000412</span>
                    <Badge variant="navy">Issued</Badge>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    AED 4,200 · Dubai · TRN 100••••••••3
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      Download PDF
                    </Button>
                    <Button size="sm" variant="outline">
                      Issue credit note
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden />
              Every layout here uses logical properties, so the whole workspace
              mirrors in Arabic without a second stylesheet.
            </p>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
