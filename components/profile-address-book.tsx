"use client";

import { PlusIcon, XMarkIcon, PencilIcon, CheckIcon, MapPinIcon } from "@heroicons/react/24/outline";
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

type FormState = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  country: string;
};

const EMPTY: FormState = {
  firstName: "", lastName: "", address1: "", address2: "",
  city: "", province: "", zip: "", country: "",
};

const inputCls = "w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none";
const labelCls = "mb-1 block text-sm uppercase tracking-wider text-brand-grey sm:text-xs";

function AddressForm({ initial, onSave, onCancel, saving }: {
  initial: FormState; onSave: (f: FormState) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>first name</label>
          <input className={inputCls} autoComplete="given-name" placeholder="first name" value={form.firstName} onChange={set("firstName")} />
        </div>
        <div>
          <label className={labelCls}>last name</label>
          <input className={inputCls} autoComplete="family-name" placeholder="last name" value={form.lastName} onChange={set("lastName")} />
        </div>
      </div>
      <div>
        <label className={labelCls}>address</label>
        <input className={inputCls} autoComplete="address-line1" placeholder="street address" value={form.address1} onChange={set("address1")} />
      </div>
      <div>
        <label className={`${labelCls} flex items-baseline gap-1.5`}>
          apt / unit <span className="normal-case tracking-normal text-brand-grey/40">optional</span>
        </label>
        <input className={inputCls} autoComplete="address-line2" placeholder="apartment, suite, unit…" value={form.address2} onChange={set("address2")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>city</label>
          <input className={inputCls} autoComplete="address-level2" placeholder="city" value={form.city} onChange={set("city")} />
        </div>
        <div>
          <label className={labelCls}>state / province</label>
          <input className={inputCls} autoComplete="address-level1" placeholder="state" value={form.province} onChange={set("province")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>zip / postal</label>
          <input className={inputCls} autoComplete="postal-code" placeholder="zip" value={form.zip} onChange={set("zip")} />
        </div>
        <div>
          <label className={labelCls}>country</label>
          <input className={inputCls} autoComplete="country-name" placeholder="country" value={form.country} onChange={set("country")} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.address1.trim() || !form.city.trim()}
          className="flex items-center gap-1.5 rounded bg-brand-gold px-3 py-1 text-xs font-medium text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
        >
          <CheckIcon className="h-3 w-3" /> {saving ? "saving..." : "save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-brand-grey transition-colors hover:text-white"
        >
          cancel
        </button>
      </div>
    </div>
  );
}

export function ProfileAddressBook() {
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

  const toPayload = (form: FormState, existing?: Address) => ({
    ...form,
    phone: existing?.phone ?? "",
  });

  const handleAdd = async (form: FormState) => {
    setSaving(true); setError("");
    const r = await fetch("/api/auth/addresses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error || "failed to save"); setSaving(false); return; }
    const newAddr: Address = { id: data.id, ...form, phone: null };
    setAddresses((prev) => {
      const next = [...prev, newAddr];
      if (prev.length === 0) setDefaultId(data.id);
      return next;
    });
    setShowAdd(false); setSaving(false);
  };

  const handleUpdate = async (id: string, form: FormState, existing: Address) => {
    setSaving(true); setError("");
    const r = await fetch(`/api/auth/addresses/${encodeURIComponent(id)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form, existing)),
    });
    if (!r.ok) { const d = await r.json(); setError(d.error || "failed to update"); setSaving(false); return; }
    setAddresses((prev) => prev.map((a) => a.id === id ? { ...a, ...form } : a));
    setEditId(null); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/auth/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) return;
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (defaultId === id) setDefaultId(next[0]?.id ?? null);
      return next;
    });
  };

  const handleSetDefault = async (id: string) => {
    const prev = defaultId; setDefaultId(id);
    const r = await fetch("/api/auth/addresses/default", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addressId: id }),
    });
    if (!r.ok) setDefaultId(prev);
  };

  if (loading) return null;

  const sorted = [...addresses].sort((a) => (a.id === defaultId ? -1 : 1));

  return (
    <div className="space-y-3">
      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
          <p className="mb-4 text-sm uppercase tracking-wider text-brand-pale-gold">new address</p>
          <AddressForm
            initial={EMPTY}
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setError(""); }}
            saving={saving}
          />
        </div>
      )}

      {/* Saved address cards */}
      {sorted.map((addr) => {
        const isDefault = addr.id === defaultId;
        const isEditing = editId === addr.id;
        const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
        const line2 = [addr.city, addr.province, addr.zip].filter(Boolean).join(", ");
        const formInitial: FormState = {
          firstName: addr.firstName ?? "",
          lastName: addr.lastName ?? "",
          address1: addr.address1 ?? "",
          address2: addr.address2 ?? "",
          city: addr.city ?? "",
          province: addr.province ?? "",
          zip: addr.zip ?? "",
          country: addr.country ?? "",
        };

        return (
          <div
            key={addr.id}
            className={`rounded-lg border bg-brand-dark p-5 ${isDefault ? "border-brand-dark-gold/40" : "border-brand-dark-gold/20"}`}
          >
            {isEditing ? (
              <>
                <p className="mb-4 text-sm uppercase tracking-wider text-brand-pale-gold">edit address</p>
                <AddressForm
                  initial={formInitial}
                  onSave={(form) => handleUpdate(addr.id, form, addr)}
                  onCancel={() => { setEditId(null); setError(""); }}
                  saving={saving}
                />
              </>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ${isDefault ? "bg-brand-gold/20 text-brand-gold" : "bg-white/5 text-white/30"}`}>
                    <MapPinIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    {name && <p className="text-sm text-white">{name}</p>}
                    {addr.address1 && <p className="text-sm text-brand-grey">{addr.address1}</p>}
                    {addr.address2 && <p className="text-sm text-brand-grey">{addr.address2}</p>}
                    {line2 && <p className="text-sm text-brand-grey">{line2}</p>}
                    {addr.country && <p className="text-sm text-brand-grey">{addr.country}</p>}
                    {!isDefault && addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="mt-1 text-xs text-brand-grey/50 transition-colors hover:text-brand-gold"
                      >
                        set as default →
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditId(addr.id); setShowAdd(false); setError(""); }}
                    className="text-xs text-brand-grey transition-colors hover:text-white"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-brand-grey/50 transition-colors hover:text-red-400"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sorted.length === 0 && !showAdd && (
        <p className="px-3 py-2 text-sm text-brand-grey/50">no saved addresses yet.</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!showAdd && !editId && (
        <button
          type="button"
          onClick={() => { setShowAdd(true); setError(""); }}
          className="flex items-center gap-1 text-xs text-brand-gold transition-colors hover:text-brand-light-gold"
        >
          <PlusIcon className="h-3.5 w-3.5" /> add address
        </button>
      )}
    </div>
  );
}
