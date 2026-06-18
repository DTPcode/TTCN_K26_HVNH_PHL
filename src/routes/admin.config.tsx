import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import {
  SETTINGS, CHANNELS, CHANNEL_CONFIGS,
  updateSetting, updateChannelConfig, testChannelConnection,
  fmtRel, type ChannelId, type ChannelConfig,
} from "@/data/mockData";
import { useSyncStore } from "@/lib/useSyncStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Save, Settings, Clock, Info, Globe, Key, Webhook, Zap,
  CheckCircle, XCircle, Loader2, Eye, EyeOff, Copy,
  Store, ShoppingBag, Music2,
} from "lucide-react";

export const Route = createFileRoute("/admin/config")({
  head: () => ({
    meta: [
      { title: "Cấu hình hệ thống — Atino SyncInventory" },
      { name: "description", content: "Thiết lập tham số hệ thống và kết nối API/Webhook cho các kênh bán hàng." },
    ],
  }),
  component: () => (
    <RequireAuth roles={["system_admin"]}>
      <AppShell title="Cấu hình hệ thống">
        <ConfigPage />
      </AppShell>
    </RequireAuth>
  ),
});

// ============================================================
// MAIN PAGE — 2 Tabs
// ============================================================
function ConfigPage() {
  useSyncStore();

  return (
    <Tabs defaultValue="channels" className="space-y-5">
      <TabsList>
        <TabsTrigger value="channels" className="gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Kênh bán hàng & Webhook
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5">
          <Settings className="w-3.5 h-3.5" /> Tham số hệ thống
        </TabsTrigger>
      </TabsList>

      <TabsContent value="channels">
        <ChannelConfigSection />
      </TabsContent>
      <TabsContent value="settings">
        <SystemSettingsSection />
      </TabsContent>
    </Tabs>
  );
}

// ============================================================
// TAB 1: CHANNEL CONFIGS (API / Webhook)
// ============================================================
const CHANNEL_ICON: Record<ChannelId, typeof Store> = {
  store: Store, shopee: ShoppingBag, tiktok: Music2, lazada: ShoppingBag, website: Globe,
};
const CHANNEL_COLORS: Record<ChannelId, string> = {
  store: "bg-indigo-100 text-indigo-700",
  shopee: "bg-orange-100 text-orange-700",
  tiktok: "bg-pink-100 text-pink-700",
  lazada: "bg-sky-100 text-sky-700",
  website: "bg-emerald-100 text-emerald-700",
};

function ChannelConfigSection() {
  const [expandedChannel, setExpandedChannel] = useState<ChannelId | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
              <Webhook className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Kết nối kênh bán hàng</h2>
              <p className="text-sm text-muted-foreground">
                Cấu hình API endpoint, API Key và Webhook URL cho từng kênh. Hệ thống sử dụng Webhook để nhận sự kiện thay đổi tồn kho theo thời gian thực.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Cards */}
      {CHANNEL_CONFIGS.map((cfg) => {
        const channel = CHANNELS.find((c) => c.id === cfg.channelId)!;
        const isExpanded = expandedChannel === cfg.channelId;
        return (
          <ChannelCard
            key={cfg.channelId}
            cfg={cfg}
            channel={channel}
            expanded={isExpanded}
            onToggle={() => setExpandedChannel(isExpanded ? null : cfg.channelId)}
          />
        );
      })}

      {/* Info Box */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <strong className="text-blue-700">Lưu ý:</strong> Trong môi trường demo, API Key và Webhook được mô phỏng (Mock).
          Trong thực tế, cần lấy API Key từ Seller Center của từng sàn (Shopee Partner, TikTok Shop Open Platform, Lazada Open Platform)
          và cấu hình Webhook URL trỏ về hệ thống Atino SyncInventory.
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ cfg, channel, expanded, onToggle }: {
  cfg: ChannelConfig;
  channel: typeof CHANNELS[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    apiBaseUrl: cfg.apiBaseUrl,
    apiKey: cfg.apiKey,
    apiSecret: cfg.apiSecret,
    webhookUrl: cfg.webhookUrl,
    webhookSecret: cfg.webhookSecret,
    syncMode: cfg.syncMode,
    pollingIntervalSec: String(cfg.pollingIntervalSec),
  });

  const Icon = CHANNEL_ICON[cfg.channelId];
  const colorCls = CHANNEL_COLORS[cfg.channelId];

  const handleTest = async () => {
    setTesting(true);
    const ok = await testChannelConnection(cfg.channelId);
    setTesting(false);
    if (ok) {
      toast.success(`Kết nối ${channel.name} thành công`);
    } else {
      toast.error(`Kết nối ${channel.name} thất bại — kiểm tra lại API Key và URL`);
    }
  };

  const handleSave = () => {
    updateChannelConfig(cfg.channelId, {
      apiBaseUrl: form.apiBaseUrl,
      apiKey: form.apiKey,
      apiSecret: form.apiSecret,
      webhookUrl: form.webhookUrl,
      webhookSecret: form.webhookSecret,
      syncMode: form.syncMode as ChannelConfig["syncMode"],
      pollingIntervalSec: Number(form.pollingIntervalSec) || 0,
    });
    setEditing(false);
    toast.success(`Đã lưu cấu hình ${channel.name}`);
  };

  const handleToggleEnabled = (enabled: boolean) => {
    updateChannelConfig(cfg.channelId, { enabled });
    toast.info(`${channel.name}: ${enabled ? "Đã bật" : "Đã tắt"} kết nối`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  return (
    <Card className={`transition-all ${!cfg.enabled ? "opacity-60" : ""}`}>
      <CardContent className="p-0">
        {/* Summary Row */}
        <div
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg grid place-items-center ${colorCls}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {channel.name}
                {cfg.testResult === "success" && (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
                {cfg.testResult === "failed" && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{cfg.apiBaseUrl}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="w-3 h-3" />
              {cfg.syncMode === "realtime" ? "Realtime" : cfg.syncMode === "polling" ? `Polling ${cfg.pollingIntervalSec}s` : "Manual"}
            </Badge>
            <Badge className={cfg.enabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
              {cfg.enabled ? "Hoạt động" : "Tắt"}
            </Badge>
            <Switch
              checked={cfg.enabled}
              onCheckedChange={handleToggleEnabled}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Expanded Detail */}
        {expanded && (
          <div className="border-t px-5 pb-5 pt-4 space-y-5">
            {/* API Configuration */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <Key className="w-4 h-4 text-primary" /> Cấu hình API
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">API Base URL</Label>
                  {editing ? (
                    <Input value={form.apiBaseUrl} onChange={(e) => setForm({ ...form, apiBaseUrl: e.target.value })} className="font-mono text-sm" />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono truncate">{cfg.apiBaseUrl}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cfg.apiBaseUrl, "API URL")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">API Key</Label>
                  {editing ? (
                    <Input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} className="font-mono text-sm" />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono truncate">{cfg.apiKey}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cfg.apiKey, "API Key")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">API Secret</Label>
                  {editing ? (
                    <Input value={form.apiSecret} onChange={(e) => setForm({ ...form, apiSecret: e.target.value })} className="font-mono text-sm" type={showSecret ? "text" : "password"} />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono truncate">
                        {showSecret ? cfg.apiSecret : "••••••••••••••••••••"}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Webhook Configuration */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <Webhook className="w-4 h-4 text-primary" /> Cấu hình Webhook
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Webhook Endpoint (Nhận sự kiện từ kênh)</Label>
                  {editing ? (
                    <Input value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} className="font-mono text-sm" />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono truncate">{cfg.webhookUrl}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cfg.webhookUrl, "Webhook URL")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Webhook Secret</Label>
                  {editing ? (
                    <Input value={form.webhookSecret} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })} className="font-mono text-sm" type="password" />
                  ) : (
                    <code className="text-sm bg-muted px-3 py-2 rounded-md font-mono mt-1 block truncate">{cfg.webhookSecret}</code>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chế độ đồng bộ</Label>
                  {editing ? (
                    <Select value={form.syncMode} onValueChange={(v) => setForm({ ...form, syncMode: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Realtime (Webhook)</SelectItem>
                        <SelectItem value="polling">Polling (định kỳ)</SelectItem>
                        <SelectItem value="manual">Manual (thủ công)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm bg-muted px-3 py-2 rounded-md font-medium mt-1">
                      {cfg.syncMode === "realtime" ? "⚡ Realtime (Webhook)" : cfg.syncMode === "polling" ? `🔄 Polling (mỗi ${cfg.pollingIntervalSec}s)` : "✋ Manual"}
                    </div>
                  )}
                </div>
              </div>
              {editing && form.syncMode === "polling" && (
                <div className="mt-3 max-w-xs">
                  <Label className="text-xs text-muted-foreground">Khoảng cách polling (giây)</Label>
                  <Input type="number" min={10} value={form.pollingIntervalSec} onChange={(e) => setForm({ ...form, pollingIntervalSec: e.target.value })} className="mt-1" />
                </div>
              )}
            </div>

            <Separator />

            {/* Status + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {cfg.lastTested ? (
                  <span className="flex items-center gap-1.5">
                    {cfg.testResult === "success" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                    Test lần cuối: {fmtRel(cfg.lastTested)} —
                    <span className={cfg.testResult === "success" ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                      {cfg.testResult === "success" ? "Thành công" : "Thất bại"}
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-600">Chưa kiểm tra kết nối</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !cfg.enabled}>
                  {testing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                  {testing ? "Đang kiểm tra..." : "Test kết nối"}
                </Button>
                {editing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// TAB 2: SYSTEM SETTINGS (giữ nguyên logic cũ)
// ============================================================
const SETTING_LABELS: Record<string, { label: string; suffix: string; icon: string }> = {
  default_low_stock_threshold: { label: "Ngưỡng cảnh báo tồn kho thấp", suffix: "sản phẩm", icon: "🔔" },
  default_safety_buffer: { label: "Ngưỡng đệm an toàn (Safety Buffer)", suffix: "sản phẩm", icon: "🛡️" },
  sync_interval_seconds: { label: "Khoảng cách đồng bộ định kỳ", suffix: "giây", icon: "⏱️" },
  sync_max_retries: { label: "Số lần retry tối đa khi đồng bộ thất bại", suffix: "lần", icon: "🔄" },
  priority_queue_threshold: { label: "Ngưỡng ưu tiên xử lý đồng bộ", suffix: "sản phẩm", icon: "⚡" },
};

function SystemSettingsSection() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    SETTINGS.forEach((s) => (m[s.key] = s.value));
    return m;
  });

  const [saving, setSaving] = useState(false);

  const hasChanges = SETTINGS.some((s) => values[s.key] !== s.value);

  const handleSave = () => {
    for (const [key, val] of Object.entries(values)) {
      const num = Number(val);
      if (val.trim() === "" || isNaN(num)) {
        toast.error(`Giá trị không hợp lệ cho "${SETTING_LABELS[key]?.label || key}"`);
        return;
      }
      if (num < 0) {
        toast.error(`"${SETTING_LABELS[key]?.label || key}" không được là số âm`);
        return;
      }
      if (!Number.isInteger(num)) {
        toast.error(`"${SETTING_LABELS[key]?.label || key}" phải là số nguyên`);
        return;
      }
      if (num > 100000) {
        toast.error(`"${SETTING_LABELS[key]?.label || key}" quá lớn (tối đa 100.000)`);
        return;
      }
    }
    setSaving(true);
    setTimeout(() => {
      Object.entries(values).forEach(([key, val]) => {
        updateSetting(key, val);
      });
      setSaving(false);
      toast.success("Đã lưu cấu hình hệ thống thành công");
    }, 400);
  };

  const handleReset = () => {
    const m: Record<string, string> = {};
    SETTINGS.forEach((s) => (m[s.key] = s.value));
    setValues(m);
    toast.info("Đã khôi phục giá trị hiện tại");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Tham số vận hành hệ thống</h2>
              <p className="text-sm text-muted-foreground">
                Cấu hình các ngưỡng và tham số kỹ thuật cho hệ thống đồng bộ tồn kho. Chỉ System Admin có quyền thay đổi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 divide-y">
          {SETTINGS.map((setting) => {
            const meta = SETTING_LABELS[setting.key] || { label: setting.key, suffix: "", icon: "⚙️" };
            const val = values[setting.key] ?? setting.value;
            const isChanged = val !== setting.value;
            return (
              <div key={setting.key} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <span>{meta.icon}</span>
                    {meta.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Cập nhật: {fmtRel(setting.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:w-48 shrink-0">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                      className={`pr-16 text-right font-mono ${isChanged ? "border-primary ring-1 ring-primary/20" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      {meta.suffix}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <strong className="text-blue-700">Lưu ý:</strong> Thay đổi cấu hình sẽ ảnh hưởng đến toàn bộ quy trình đồng bộ tồn kho.
          Safety Buffer sẽ giữ lại một lượng tồn kho dự phòng, không đẩy lên các sàn TMĐT khi đồng bộ.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
          Hủy thay đổi
        </Button>
        {hasChanges && (
          <span className="text-xs text-amber-600 ml-2">● Có thay đổi chưa lưu</span>
        )}
      </div>
    </div>
  );
}
