import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

const categories = ["Concerts", "Sports", "Theatre", "Family", "Comedy", "Festivals"];

const empty = {
  title: "",
  artist: "",
  venue: "",
  city: "",
  date: "",
  time: "",
  image_url: "",
  category: "Concerts",
  description: "",
};

const fieldCls =
  "w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30";
const labelCls = "text-[10px] font-bold text-neutral-400 tracking-widest";

export default function AdminEvents() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const list = await base44.entities.Event.list("-date", 100);
      setItems(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("image_url", file_url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setEditing("new");
    setForm(empty);
  };
  const openEdit = (ev) => {
    setEditing(ev.id);
    setForm({ ...empty, ...ev });
  };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.title.trim() || !form.venue.trim() || !form.date) {
      toast({ title: "Title, venue and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing === "new") {
        await base44.entities.Event.create(form);
      } else {
        await base44.entities.Event.update(editing, form);
      }
      toast({ title: "Event saved" });
      setEditing(null);
      load();
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ev) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    try {
      await base44.entities.Event.delete(ev.id);
      toast({ title: "Event deleted" });
      load();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="px-4">
      <button
        onClick={openNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563eb] text-white font-bold text-sm mb-4 active:scale-95 transition"
      >
        <Plus className="h-5 w-5" /> Add event
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-neutral-200 border-t-[#2563eb] rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-neutral-400 py-10">No events yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-neutral-200/60"
            >
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                {ev.image_url ? (
                  <Image src={ev.image_url} fittingType="fill" className="h-full w-full" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 line-clamp-1">{ev.title}</p>
                <p className="text-xs text-neutral-500 line-clamp-1">
                  {ev.date} · {ev.venue}
                </p>
              </div>
              <button onClick={() => openEdit(ev)} className="p-2 text-neutral-500 active:scale-90">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(ev)} className="p-2 text-red-500 active:scale-90">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 sticky top-0 bg-white">
              <h3 className="font-bold text-neutral-900">
                {editing === "new" ? "Add event" : "Edit event"}
              </h3>
              <button onClick={close} className="p-1">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className={labelCls}>TITLE</p>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <p className={labelCls}>ARTIST</p>
                <input value={form.artist} onChange={(e) => set("artist", e.target.value)} className={fieldCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={labelCls}>VENUE</p>
                  <input value={form.venue} onChange={(e) => set("venue", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>CITY</p>
                  <input value={form.city} onChange={(e) => set("city", e.target.value)} className={fieldCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={labelCls}>DATE</p>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <p className={labelCls}>TIME</p>
                  <input value={form.time} onChange={(e) => set("time", e.target.value)} placeholder="7:00 PM" className={fieldCls} />
                </div>
              </div>
              <div>
                <p className={labelCls}>CATEGORY</p>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={fieldCls}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className={labelCls}>DESCRIPTION</p>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={fieldCls} />
              </div>
              <div>
                <p className={labelCls}>IMAGE</p>
                {form.image_url ? (
                  <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-neutral-100 mb-2">
                    <Image src={form.image_url} fittingType="fill" className="h-full w-full" />
                  </div>
                ) : null}
                <label className="block text-center py-2 rounded-lg border border-dashed border-neutral-300 text-xs font-bold text-[#2563eb] cursor-pointer">
                  {uploading ? "Uploading…" : "Upload image"}
                  <input type="file" accept="image/*" className="hidden" onChange={onImage} disabled={uploading} />
                </label>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#2563eb] text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition"
              >
                {saving ? "Saving…" : "Save event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
