"use client";

import { PlusIcon, XMarkIcon, PencilIcon, CheckIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

type Address = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
};

type FormState = Omit<Address, "id">;

const EMPTY_FORM: FormState = {
  firstName: "", lastName: "", address1: "", address2: "",
  city: "", province: "", zip: "", country: "", phone: "",
};

function AddressForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">First name</label>
          <input className="address-input" placeholder="First" autoComplete="given-name" value={form.firstName ?? ""} onChange={set("firstName")} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">Last name</label>
          <input className="address-input" placeholder="Last" autoComplete="family-name" value={form.lastName ?? ""} onChange={set("lastName")} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">Address</label>
        <input className="address-input" placeholder="Street address" autoComplete="address-line1" value={form.address1 ?? ""} onChange={set("address1")} />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">Apt / Unit (optional)</label>
        <input className="address-input" placeholder="Apartment, suite, unit…" autoComplete="address-line2" value={form.address2 ?? ""} onChange={set("address2")} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">City</label>
          <input className="address-input" placeholder="City" autoComplete="address-level2" value={form.city ?? ""} onChange={set("city")} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">State / Province</label>
          <input className="address-input" placeholder="State" autoComplete="address-level1" value={form.province ?? ""} onChange={set("province")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">ZIP / Postal</label>
          <input className="address-input" placeholder="ZIP" autoComplete="postal-code" value={form.zip ?? ""} onChange={set("zip")} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">Country</label>
          <input className="address-input" placeholder="Country" autoComplete="country-name" value={form.country ?? ""} onChange={set("country")} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-brand-grey/60">Phone (optional)</label>
        <input className="address-input" placeholder="+1 (555) 000-0000" autoComplete="tel" value={form.phone ?? ""} onChange={set("phone")} />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.address1?.trim() || !form.city?.trim()}
          className="flex items-center gap-1.5 rounded-full bg-brand-gold px-5 py-2 text-xs font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : <><CheckIcon className="h-3.5 w-3.5" /> Save address</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddressCard({
  addr,
  isDefault,
  isEditing,
  saving,
  onEdit,
  onDelete,
  onSetDefault,
  onSave,
  onCancelEdit,
}: {
  addr: Address;
  isDefault: boolean;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onSave: (form: FormState) => void;
  onCancelEdit: () => void;
}) {
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  const line2 = [addr.city, addr.province, addr.zip].filter(Boolean).join(", ");

  return (
    <div className={`group relative rounded-xl border p-5 transition-all duration-200 ${
      isDefault
        ? "border-brand-gold/30 bg-gradient-to-br from-brand-gold/[0.07] to-transparent"
        : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
    }`}>
      {isEditing ? (
        <div>
          <p className="mb-4 text-[10px] uppercase tracking-widest text-brand-pale-gold/60">editing address</p>
          <AddressForm
            initial={{ firstName: addr.firstName, lastName: addr.lastName, address1: addr.address1, address2: addr.address2, city: addr.city, province: addr.province, zip: addr.zip, country: addr.country, phone: addr.phone }}
            onSave={onSave}
            onCancel={onCancelEdit}
            saving={saving}
          />
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full ${
            isDefault ? "bg-brand-gold/15 text-brand-gold" : "bg-white/5 text-white/30"
          }`}>
            <MapPinIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            {isDefault && (
              <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-brand-gold">
                <CheckCircleIcon className="h-3.5 w-3.5" /> Default
              </div>
            )}
            {name && <p className="text-sm font-medium text-white">{name}</p>}
            {addr.address1 && <p className="text-sm text-brand-grey/80">{addr.address1}</p>}
            {addr.address2 && <p className="text-sm text-brand-grey/60">{addr.address2}</p>}
            {line2 && <p className="text-sm text-brand-grey/60">{line2}</p>}
            {addr.country && <p className="text-sm text-brand-grey/60">{addr.country}</p>}
            {addr.phone && <p className="mt-1.5 text-xs text-brand-grey/40">{addr.phone}</p>}
            {!isDefault && (
              <button
                type="button"
                onClick={onSetDefault}
                className="mt-2 text-[11px] text-brand-grey/40 transition-colors hover:text-brand-gold"
              >
                set as default →
              </button>
            )}
          </div>
          <div className="flex flex-none gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/5 hover:text-white"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/addresses")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setAddresses(d.addresses); setDefaultId(d.defaultAddressId); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (form: FormState) => {
    setSaving(true); setError("");
    const r = await fetch("/api/auth/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }
    setAddresses((prev) => [...prev, { id: data.id, ...form }]);
    if (addresses.length === 0) setDefaultId(data.id);
    setShowAdd(false);
    setSaving(false);
  };

  const handleUpdate = async (id: string, form: FormState) => {
    setSaving(true); setError("");
    const r = await fetch(`/api/auth/addresses/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) { const d = await r.json(); setError(d.error || "Failed to update"); setSaving(false); return; }
    setAddresses((prev) => prev.map((a) => a.id === id ? { id, ...form } : a));
    setEditId(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/auth/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (defaultId === id) setDefaultId(addresses.find((a) => a.id !== id)?.id ?? null);
  };

  const handleSetDefault = async (id: string) => {
    const prev = defaultId;
    setDefaultId(id);
    const r = await fetch("/api/auth/addresses/default", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: id }),
    });
    if (!r.ok) setDefaultId(prev);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-brand-light-gold">address book</h2>
          <p className="mt-0.5 text-xs text-brand-grey/50">saved addresses auto-fill at checkout</p>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={() => { setShowAdd(true); setEditId(null); setError(""); }}
            className="flex items-center gap-1.5 rounded-full border border-brand-dark-gold/30 px-3.5 py-1.5 text-xs uppercase tracking-wider text-brand-pale-gold transition-colors hover:border-brand-gold/60 hover:text-brand-gold"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add address
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/[0.03] border border-white/[0.06]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {showAdd && (
            <div className="rounded-xl border border-brand-gold/20 bg-gradient-to-br from-brand-gold/[0.06] to-transparent p-5">
              <p className="mb-4 text-[10px] uppercase tracking-widest text-brand-pale-gold/70">new address</p>
              <AddressForm
                initial={EMPTY_FORM}
                onSave={handleAdd}
                onCancel={() => { setShowAdd(false); setError(""); }}
                saving={saving}
              />
            </div>
          )}

          {addresses.length === 0 && !showAdd && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <MapPinIcon className="h-6 w-6 text-brand-grey/40" />
              </div>
              <p className="text-sm text-brand-pale-gold">No saved addresses yet</p>
              <p className="mt-1 text-xs text-brand-grey/50">Add an address to speed up checkout.</p>
            </div>
          )}

          {[...addresses].sort((a) => (a.id === defaultId ? -1 : 1)).map((addr) => (
            <AddressCard
              key={addr.id}
              addr={addr}
              isDefault={addr.id === defaultId}
              isEditing={editId === addr.id}
              saving={saving}
              onEdit={() => { setEditId(addr.id); setShowAdd(false); setError(""); }}
              onDelete={() => handleDelete(addr.id)}
              onSetDefault={() => handleSetDefault(addr.id)}
              onSave={(form) => handleUpdate(addr.id, form)}
              onCancelEdit={() => { setEditId(null); setError(""); }}
            />
          ))}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</p>
          )}

          {addresses.length > 0 && (
            <p className="pt-1 text-xs text-brand-grey/30">
              Your default address will be pre-selected at checkout.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
