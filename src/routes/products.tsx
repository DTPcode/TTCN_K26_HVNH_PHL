import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import {
  PRODUCTS, SKUS, fmtVN, fmtCurrency, fmtTime,
  addProduct, updateProduct, type Product,
} from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Plus, Package, Edit, Ban, CheckCircle, Eye,
} from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Quản lý sản phẩm — Atino SyncInventory" },
      { name: "description", content: "Quản lý danh sách sản phẩm, biến thể, và trạng thái kinh doanh." },
    ],
  }),
  component: () => (
    <RequireAuth roles={["ecommerce_admin", "system_admin", "warehouse_manager"]}>
      <AppShell title="Quản lý sản phẩm">
        <ProductsBody />
      </AppShell>
    </RequireAuth>
  ),
});

const CATEGORIES = ["Tất cả", "Áo Polo", "Áo Thun", "Áo Sơ Mi", "Quần Âu", "Quần Jeans", "Quần Short", "Áo Khoác", "Áo Hoodie", "Áo Vest", "Quần Jogger"];

const STATUS_MAP: Record<Product["status"], { label: string; cls: string }> = {
  active: { label: "Đang bán", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Tạm dừng", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  discontinued: { label: "Ngừng kinh doanh", cls: "bg-red-100 text-red-700 border-red-200" },
};

function ProductsBody() {
  useSyncStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (catFilter !== "Tất cả" && p.category !== catFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, catFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang bán</SelectItem>
              <SelectItem value="inactive">Tạm dừng</SelectItem>
              <SelectItem value="discontinued">Ngừng KD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Thêm sản phẩm
        </Button>
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState message="Không tìm thấy sản phẩm nào" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2.5">Sản phẩm</th>
                  <th className="px-4 py-2.5">Danh mục</th>
                  <th className="px-4 py-2.5 text-right">Giá gốc</th>
                  <th className="px-4 py-2.5 text-right">Biến thể</th>
                  <th className="px-4 py-2.5 text-right">Tổng tồn kho</th>
                  <th className="px-4 py-2.5 text-center">Trạng thái</th>
                  <th className="px-4 py-2.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const variants = SKUS.filter((s) => s.productId === p.id);
                  const totalStock = variants.reduce((a, v) => a + v.central, 0);
                  const st = STATUS_MAP[p.status];
                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-primary/10 grid place-items-center shrink-0">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{p.category}</Badge></td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtCurrency(p.basePrice)}</td>
                      <td className="px-4 py-3 text-right">{fmtVN(variants.length)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtVN(totalStock)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${st.cls} hover:${st.cls.split(" ")[0]}`}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewProduct(p)} title="Xem chi tiết">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditProduct(p)} title="Chỉnh sửa">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          {p.status === "active" ? (
                            <Button variant="ghost" size="sm" title="Ngừng kinh doanh" onClick={() => {
                              updateProduct(p.id, { status: "discontinued" });
                              toast.success(`Đã ngừng kinh doanh: ${p.name}`);
                            }}>
                              <Ban className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" title="Kích hoạt lại" onClick={() => {
                              updateProduct(p.id, { status: "active" });
                              toast.success(`Đã kích hoạt lại: ${p.name}`);
                            }}>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <AddProductDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Product Dialog */}
      {editProduct && (
        <EditProductDialog product={editProduct} onClose={() => setEditProduct(null)} />
      )}

      {/* View Variants Dialog */}
      {viewProduct && (
        <ViewVariantsDialog product={viewProduct} onClose={() => setViewProduct(null)} />
      )}
    </div>
  );
}

function AddProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Áo Polo");
  const [price, setPrice] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !price.trim()) { toast.error("Vui lòng điền đầy đủ thông tin"); return; }
    addProduct({
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
      category,
      brand: "Atino",
      basePrice: Number(price),
      status: "active",
    });
    toast.success(`Đã thêm sản phẩm: ${name}`);
    setName(""); setCategory("Áo Polo"); setPrice("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tên sản phẩm</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Áo Polo Premium" />
          </div>
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((c) => c !== "Tất cả").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Giá gốc (₫)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="399000" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Hủy</Button></DialogClose>
          <Button onClick={handleSubmit}><Plus className="w-4 h-4 mr-1.5" /> Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.basePrice));

  const handleSave = () => {
    updateProduct(product.id, { name, category, basePrice: Number(price) });
    toast.success(`Đã cập nhật: ${name}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tên sản phẩm</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((c) => c !== "Tất cả").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Giá gốc (₫)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewVariantsDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const variants = SKUS.filter((s) => s.productId === product.id);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.name} — Danh sách biến thể</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Tên</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Màu</th>
                <th className="px-3 py-2 text-right">Giá</th>
                <th className="px-3 py-2 text-right">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.sku} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                  <td className="px-3 py-2">{v.name}</td>
                  <td className="px-3 py-2"><Badge variant="outline">{v.size}</Badge></td>
                  <td className="px-3 py-2">{v.color}</td>
                  <td className="px-3 py-2 text-right">{fmtCurrency(v.price)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    <span className={v.central === 0 ? "text-red-600" : v.central <= v.lowStockThreshold ? "text-amber-600" : ""}>
                      {fmtVN(v.central)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Ngày tạo: {fmtTime(product.createdAt)} · Tổng biến thể: {variants.length} · Tổng tồn kho: {fmtVN(variants.reduce((a, v) => a + v.central, 0))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
