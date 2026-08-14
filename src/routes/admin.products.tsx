import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBrands, useCategories, type Product } from "@/lib/data";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Draft = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  sale_price: string;
  stock: string;
  brand_id: string;
  category_id: string;
  images: string;
  specs: string;
  variations: string;
  is_published: boolean;
  is_featured: boolean;
  is_new: boolean;
};

const EMPTY: Draft = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "0",
  sale_price: "",
  stock: "0",
  brand_id: "",
  category_id: "",
  images: "",
  specs: "",
  variations: "",
  is_published: true,
  is_featured: false,
  is_new: false,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminProducts() {
  const qc = useQueryClient();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

  const filtered = useMemo(
    () =>
      (products.data ?? []).filter((p) =>
        `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [products.data, search],
  );

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name.trim(),
        slug: d.slug.trim() || slugify(d.name),
        sku: d.sku.trim() || null,
        description: d.description,
        price: Number(d.price) || 0,
        sale_price: d.sale_price === "" ? null : Number(d.sale_price),
        stock: Number(d.stock) || 0,
        brand_id: d.brand_id || null,
        category_id: d.category_id || null,
        images: d.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        specs: d.specs
          .split("\n")
          .map((line) => line.split("|"))
          .filter((p) => p.length === 2)
          .map(([label, value]) => ({ label: label!.trim(), value: value!.trim() })),
        variations: d.variations
          .split("\n")
          .map((line) => line.split("|"))
          .filter((p) => p.length === 2)
          .map(([name, opts]) => ({ name: name!.trim(), options: opts!.split(",").map((o) => o.trim()) })),
        is_published: d.is_published,
        is_featured: d.is_featured,
        is_new: d.is_new,
      };
      if (!payload.name) throw new Error("Product name is required");
      const { error } = d.id
        ? await supabase.from("products").update(payload).eq("id", d.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setDraft(EMPTY);
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quick = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error("Could not delete — the product may be part of an order. Unpublish it instead."),
  });

  const duplicate = (p: Product) => {
    setDraft({
      name: `${p.name} (copy)`,
      slug: `${p.slug}-copy`,
      sku: p.sku ? `${p.sku}-C` : "",
      description: p.description ?? "",
      price: String(p.price),
      sale_price: p.sale_price == null ? "" : String(p.sale_price),
      stock: String(p.stock),
      brand_id: p.brand_id ?? "",
      category_id: p.category_id ?? "",
      images: (p.images ?? []).join("\n"),
      specs: (p.specs ?? []).map((s) => `${s.label}|${s.value}`).join("\n"),
      variations: (p.variations ?? []).map((v) => `${v.name}|${v.options.join(", ")}`).join("\n"),
      is_published: p.is_published,
      is_featured: p.is_featured,
      is_new: p.is_new,
    });
    setOpen(true);
  };

  const edit = (p: Product) => {
    duplicate(p);
    setDraft((d) => ({ ...d, id: p.id, name: p.name, slug: p.slug, sku: p.sku ?? "" }));
  };

  return (
    <AdminLayout title="Products">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU"
          className="max-w-xs"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="ml-auto"
              onClick={() => {
                setDraft(EMPTY);
                setOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit product" : "Add product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={draft.slug}
                  placeholder={slugify(draft.name)}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Discounted price</Label>
                <Input
                  type="number"
                  value={draft.sale_price}
                  onChange={(e) => setDraft({ ...draft, sale_price: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Stock quantity</Label>
                <Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={draft.category_id} onValueChange={(v) => setDraft({ ...draft, category_id: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand</Label>
                <Select value={draft.brand_id} onValueChange={(v) => setDraft({ ...draft, brand_id: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {(brands ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Image URLs (one per line)</Label>
                <Textarea value={draft.images} onChange={(e) => setDraft({ ...draft, images: e.target.value })} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Specifications (one per line, format: Label|Value)</Label>
                <Textarea value={draft.specs} onChange={(e) => setDraft({ ...draft, specs: e.target.value })} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Variations (one per line, format: Size|S, M, L)</Label>
                <Textarea value={draft.variations} onChange={(e) => setDraft({ ...draft, variations: e.target.value })} className="mt-1" />
              </div>
              <div className="flex flex-wrap gap-6 sm:col-span-2">
                {(
                  [
                    ["is_published", "Published"],
                    ["is_featured", "Featured"],
                    ["is_new", "New"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Switch checked={draft[k]} onCheckedChange={(v) => setDraft({ ...draft, [k]: v })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-secondary/50 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0] ?? ""} alt={p.name} className="h-10 w-10 rounded object-cover" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {money(p.sale_price ?? p.price)}
                  {p.sale_price != null && (
                    <span className="ml-1 text-xs text-muted-foreground line-through">{money(p.price)}</span>
                  )}
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    defaultValue={p.stock}
                    className="h-8 w-20"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== p.stock) quick.mutate({ id: p.id, patch: { stock: v } });
                    }}
                  />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Switch
                      checked={p.is_published}
                      onCheckedChange={(v) => quick.mutate({ id: p.id, patch: { is_published: v } })}
                    />
                    {p.stock <= 0 && <Badge variant="destructive">Out</Badge>}
                    {p.stock > 0 && p.stock <= 5 && <Badge variant="secondary">Low</Badge>}
                    {p.is_featured && <Badge>Featured</Badge>}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => edit(p)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => duplicate(p)} aria-label="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the product from the store permanently.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate(p.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
