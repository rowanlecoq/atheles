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

const EMPTY: FormState = {
  firstName: "", lastName: "", address1: "", address2: "",
  city: "", province: "", zip: "", country: "", phone: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-brand-grey/50">{label}</label>
      {children}
    </div>
  );
}

function AddrInput({ autoComplete, placeholder, value, onChange }: {
  autoComplete: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      className="w-full rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-brand-gold/40"
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

function AddressForm({ initial, onSave, onCancel, saving }: {
  initial: FormState; onSave: (f: FormState) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="First name"><AddrInput autoComplete="given-name" placeholder="First" value={form.firstName ?? ""} onChange={set("firstName")} /></Field>
        <Field label="Last name"><AddrInput autoComplete="family-name" placeholder="Last" value={form.lastName ?? ""} onChange={set("lastName")} /></Field>
      </div>
      <Field label="Address">
        <AddrInput autoComplete="address-line1" placeholder="Street address" value={form.address1 ?? ""} onChange={set("address1")} />
      </Field>
      <Field label="Apt / Unit (optional)">
        <AddrInput autoComplete="address-line2" placeholder="Apartment, suite, unit…" value={form.address2 ?? ""} onChange={set("address2")} />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="City"><AddrInput autoComplete="address-level2" placeholder="City" value={form.city ?? ""} onChange={set("city")} /></Field>
        <Field label="State / Province"><AddrInput autoComplete="address-level1" placeholder="State" value={form.province ?? ""} onChange={set("province")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="ZIP / Postal"><AddrInput autoComplete="postal-code" placeholder="ZIP" value={form.zip ?? ""} onChange={set("zip")} /></Field>
        <Field label="Country"><AddrInput autoComplete="country-name" placeholder="Country" value={form.country ?? ""} onChange={set("country")} /></Field>
      </div>
      <Field label="Phone (optional)">
        <AddrInput autoComplete="tel" placeholder="+1 (555) 000-0000" value={form.phone ?? ""} onChange={set("phone")} />
      </Field>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.address1?.trim() || !form.city?.trim()}
          className="flex items-center gap-1.5 rounded-full bg-brand-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : <><CheckIcon className="h-3.5 w-3.5" /> Save</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/40 transition-colors hover:border-white/20 hover:text-white/60"
        >
          Cancel
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

  const handleAdd = async (form: FormState) => {
    setSaving(true); setError("");
    const r = await fetch("/api/auth/addresses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }
    setAddresses((prev) => [...prev, { id: data.id, ...form }]);
    if (addresses.length === 0) setDefaultId(data.id);
    setShowAdd(false); setSaving(false);
  };

  const handleUpdate = async (id: string, form: FormState) => {
    setSaving(true); setError("");
    const r = await fetch(`/api/auth/addresses/${encodeURIComponent(id)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (!r.ok) { const d = await r.json(); setError(d.error || "Failed to update"); setSaving(false); return; }
    setAddresses((prev) => prev.map((a) => a.id === id ? { id, ...form } : a));
    setEditId(null); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const r = await fetch(`/api/auth/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (defaultId === id) setDefaultId(addresses.find((a) => a.id !== id)?.id ?? null);
  };

  const handleSetDefault = async (id: string) => {
    const prev = defaultId; setDefaultId(id);
    const r = await fetch("/api/auth/addresses/default", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addressId: id }),
    });
    if (!r.ok) setDefaultId(prev);
  };

  const sorted = [...addresses].sort((a) => (a.id === defaultId ? -1 : 1));

  return (
    <div className="space-y-3">
      {!loading && !showAdd && (
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditId(null); setError(""); }}
          className="flex items-center gap-1.5 rounded-full border border-brand-dark-gold/25 px-3 py-1.5 text-xs uppercase tracking-wider text-brand-pale-gold/70 transition-colors hover:border-brand-gold/50 hover:text-brand-gold"
        >
          <PlusIcon className="h-3 w-3" /> Add address
        </button>
      )}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04] border border-white/[0.06]" />)}
        </div>
      ) : (
        <>
          {showAdd && (
            <div className="rounded-xl border border-brand-gold/25 bg-brand-dark/70 p-4">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-brand-pale-gold/60">new address</p>
              <AddressForm
                initial={EMPTY}
                onSave={handleAdd}
                onCancel={() => { setShowAdd(false); setError(""); }}
                saving={saving}
              />
            </div>
          )}

          {sorted.length === 0 && !showAdd && (
            <p className="text-sm text-brand-grey/40">No saved addresses yet.</p>
          )}

          {sorted.map((addr) => {
            const isDefault = addr.id === defaultId;
            const isEditing = editId === addr.id;
            const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
            const line2 = [addr.city, addr.province, addr.zip].filter(Boolean).join(", ");

            return (
              <div
                key={addr.id}
                className={`group rounded-xl border p-4 transition-all ${
                  isDefault
                    ? "border-brand-gold/25 bg-brand-dark/70"
                    : "border-white/[0.08] bg-brand-dark/50"
                }`}
              >
                {isEditing ? (
                  <div>
                    <p className="mb-3 text-[10px] uppercase tracking-widest text-brand-pale-gold/60">editing address</p>
                    <AddressForm
                      initial={{ firstName: addr.firstName, lastName: addr.lastName, address1: addr.address1, address2: addr.address2, city: addr.city, province: addr.province, zip: addr.zip, country: addr.country, phone: addr.phone }}
                      onSave={(form) => handleUpdate(addr.id, form)}
                      onCancel={() => { setEditId(null); setError(""); }}
                      saving={saving}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
                      isDefault ? "bg-brand-gold/20 text-brand-gold" : "bg-white/5 text-white/30"
                    }`}>
                      <MapPinIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {isDefault && (
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-brand-gold">
                          <CheckCircleIcon className="h-3 w-3" /> Default
                        </div>
                      )}
                      {name && <p className="text-sm font-medium text-white">{name}</p>}
                      {addr.address1 && <p className="text-xs text-brand-grey/70">{addr.address1}</p>}
                      {addr.address2 && <p className="text-xs text-brand-grey/50">{addr.address2}</p>}
                      {line2 && <p className="text-xs text-brand-grey/50">{line2}</p>}
                      {addr.country && <p className="text-xs text-brand-grey/40">{addr.country}</p>}
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="mt-1 text-[11px] text-brand-grey/35 transition-colors hover:text-brand-gold"
                        >
                          set as default →
                        </button>
                      )}
                    </div>
                    <div className="flex flex-none gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => { setEditId(addr.id); setShowAdd(false); setError(""); }}
                        aria-label="Edit"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        aria-label="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
