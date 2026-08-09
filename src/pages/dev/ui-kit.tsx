/**
 * Carsens UI Kit — living reference for every base component and token (task P0-08).
 * Internal page: not linked from the product; excluded from sitemaps; noindex.
 */
import Head from "next/head";
import { Search, Car, Heart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  Panel,
  SurfaceCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FieldMessage } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const SWATCHES = [
  ["brand", "bg-brand", "#23416B"],
  ["brand-hover", "bg-brand-hover", "#1B3556"],
  ["brand-mid", "bg-brand-mid", "#34619E"],
  ["brand-light", "bg-brand-light", "#E6EEF8"],
  ["brand-surface", "bg-brand-surface", "#F0F6FF"],
  ["ink", "bg-ink", "#111827"],
  ["muted", "bg-muted", "#6B7280"],
  ["line", "bg-line", "#E5E7EB"],
  ["page", "bg-page", "#F7F8FB"],
  ["success", "bg-success", "#22C55E"],
  ["warning", "bg-warning", "#EAB308"],
  ["danger", "bg-danger", "#DC2626"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b-2 border-brand-light pb-2 text-lg font-extrabold text-brand">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UiKitPage() {
  return (
    <>
      <Head>
        <title>Carsens UI Kit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="container-shell py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">
            carsens<span className="text-brand-border">.</span>{" "}
            <span className="text-ink">UI Kit</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Design tokens + base components (task P0-08). Every product surface builds from these —
            no raw hex, no physical margins (logical properties only).
          </p>
        </header>

        <Section title="Color tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {SWATCHES.map(([name, cls, hex]) => (
              <div key={name} className="overflow-hidden rounded-card border border-line bg-card">
                <div className={`h-12 ${cls}`} />
                <div className="p-2">
                  <div className="text-xs font-bold text-ink">{name}</div>
                  <div className="text-[10px] text-muted">{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-2 rounded-card border border-line bg-card p-5">
            <p className="text-3xl font-extrabold text-ink">Find your perfect car in the UAE</p>
            <p className="text-xl font-bold text-ink">Featured cars — section heading</p>
            <p className="text-base text-ink">
              Body text — Inter Variable, with Noto Sans Arabic for RTL locales.
            </p>
            <p className="text-sm text-muted">Muted supporting text · AED 149,000 · 2023 · 45,000 km</p>
            <p className="font-serif text-base italic text-ink">Georgia serif — editorial accents.</p>
            <p dir="rtl" className="text-base text-ink">
              نص عربي تجريبي — يعرض الخط العربي مع الاتجاه من اليمين إلى اليسار.
            </p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-card p-5">
            <Button>
              <Search /> Search cars
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Delete listing</Button>
            <Button variant="link">Link action</Button>
            <Button loading>Publishing…</Button>
            <Button size="sm" variant="outline">
              Small
            </Button>
            <Button size="lg">
              <Car /> Sell your car
            </Button>
            <Button size="icon" variant="secondary" aria-label="Save to favourites">
              <Heart />
            </Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-card p-5">
            <Badge>Featured</Badge>
            <Badge variant="green">Verified dealer</Badge>
            <Badge variant="green">200-point inspected</Badge>
            <Badge variant="amber">Pending review</Badge>
            <Badge variant="red">Rejected</Badge>
            <Badge variant="neutral">Draft</Badge>
            <Badge variant="solid">New</Badge>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Standard card</CardTitle>
                <CardDescription>10px radius, soft shadow — listing cards, forms.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink">Toyota Land Cruiser GR-Sport</p>
                <p className="text-sm font-bold text-brand">AED 355,000</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">
                  <Phone /> Call
                </Button>
                <Button size="sm">View details</Button>
              </CardFooter>
            </Card>
            <Panel className="p-5">
              <h3 className="font-bold text-ink">Panel</h3>
              <p className="mt-1 text-sm text-muted">
                16px radius, elevated shadow — hero surfaces, modals, feature sections.
              </p>
            </Panel>
            <SurfaceCard className="p-5">
              <h3 className="font-bold text-brand">Surface callout</h3>
              <p className="mt-1 text-sm text-ink">
                Brand-tinted surface — highlights, tips, summary blocks.
              </p>
            </SurfaceCard>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-5 rounded-card border border-line bg-card p-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="kit-price" required>
                Asking price (AED)
              </Label>
              <Input id="kit-price" placeholder="e.g. 149,000" inputMode="numeric" />
              <FieldMessage>Buyers see this before contacting you.</FieldMessage>
            </div>
            <div>
              <Label htmlFor="kit-invalid">Email</Label>
              <Input id="kit-invalid" invalid defaultValue="not-an-email" aria-describedby="kit-invalid-err" />
              <FieldMessage error id="kit-invalid-err">
                Enter a valid email address.
              </FieldMessage>
            </div>
            <div>
              <Label htmlFor="kit-make">Make</Label>
              <Select>
                <SelectTrigger id="kit-make" className="w-full">
                  <SelectValue placeholder="Select a make" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toyota">Toyota</SelectItem>
                  <SelectItem value="nissan">Nissan</SelectItem>
                  <SelectItem value="bmw">BMW</SelectItem>
                  <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kit-desc">Description</Label>
              <Textarea id="kit-desc" placeholder="Describe your car…" />
            </div>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="specs" className="rounded-card border border-line bg-card p-5">
            <TabsList>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="history">Vehicle history</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>
            <TabsContent value="specs" className="text-sm text-ink">
              Engine, dimensions, safety — spec groups render here.
            </TabsContent>
            <TabsContent value="history" className="text-sm text-ink">
              Ownership, accident and service history.
            </TabsContent>
            <TabsContent value="finance" className="text-sm text-ink">
              EMI calculator lives here.
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Table">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Listing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Leads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Toyota Camry Grande 2023</TableCell>
                <TableCell>
                  <Badge variant="green">Live</Badge>
                </TableCell>
                <TableCell>1,284</TableCell>
                <TableCell>17</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Nissan Patrol Platinum 2022</TableCell>
                <TableCell>
                  <Badge variant="amber">Pending review</Badge>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">BMW X5 xDrive40i 2021</TableCell>
                <TableCell>
                  <Badge variant="neutral">Sold</Badge>
                </TableCell>
                <TableCell>3,911</TableCell>
                <TableCell>42</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="Dialog & Toasts">
          <div className="flex flex-wrap gap-3 rounded-card border border-line bg-card p-5">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this listing?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The listing and its leads history will be removed.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="danger">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="secondary"
              onClick={() =>
                toast({ title: "Listing published", description: "Your car is now live. 🎉", variant: "success" })
              }
            >
              Success toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast({ title: "Quota reached", description: "Upgrade your package to add more listings.", variant: "warning" })
              }
            >
              Warning toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast({ title: "Something went wrong", description: "Please try again.", variant: "error" })}
            >
              Error toast
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}
