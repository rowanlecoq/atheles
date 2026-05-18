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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] tracking-wider text-brand-grey/50">{label}</label>
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
      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-brand-gold/40"
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
        <Field label="first name"><AddrInput autoComplete="given-name" placeholder="first" value={form.firstName} onChange={set("firstName")} /></Field>
        <Field label="last name"><AddrInput autoComplete="family-name" placeholder="last" value={form.lastName} onChange={set("lastName")} /></Field>
      </div>
      <Field label="address">
        <AddrInput autoComplete="address-line1" placeholder="street address" value={form.address1} onChange={set("address1")} />
      </Field>
      <Field label="apt / unit (optional)">
        <AddrInput autoComplete="address-line2" placeholder="apartment, suite, unit…" value={form.address2} onChange={set("address2")} />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="city"><AddrInput autoComplete="address-level2" placeholder="city" value={form.city} onChange={set("city")} /></Field>
        <Field label="state / province"><AddrInput autoComplete="address-level1" placeholder="state" value={form.province} onChange={set("province")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="zip / postal"><AddrInput autoComplete="postal-code" placeholder="zip" value={form.zip} onChange={set("zip")} /></Field>
        <Field label="country"><AddrInput autoComplete="country-name" placeholder="country" value={form.country} onChange={set("country")} /></Field>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.address1.trim() || !form.city.trim()}
          className="flex items-center gap-1.5 rounded-full bg-brand-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "saving…" : <><CheckIcon className="h-3.5 w-3.5" /> save</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/40 transition-colors hover:border-white/20 hover:text-white/60"
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

  const sorted = [...addresses].sort((a) => (a.id === defaultId ? -1 : 1));

  return (
    <div className="space-y-3">
      {!loading && !showAdd && (
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditId(null); setError(""); }}
          className="flex items-center gap-1.5 rounded-full border border-brand-dark-gold/25 px-3 py-1.5 text-xs uppercase tracking-wider text-brand-pale-gold/70 transition-colors hover:border-brand-gold/50 hover:text-brand-gold"
        >
          <PlusIcon className="h-3 w-3" /> add address
        </button>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-white/[0.06] bg-brand-dark" />)}
        </div>
      ) : (
        <>
          {showAdd && (
            <div className="rounded-xl border border-brand-gold/25 bg-brand-dark p-4">
              <p className="mb-3 text-[10px] tracking-widest text-brand-pale-gold/60">new address</p>
              <AddressForm
                initial={EMPTY}
                onSave={handleAdd}
                onCancel={() => { setShowAdd(false); setError(""); }}
                saving={saving}
              />
            </div>
          )}

          {sorted.length === 0 && !showAdd && (
            <p className="text-sm text-brand-grey/40">no saved addresses yet.</p>
          )}

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
                className={`rounded-xl border p-4 transition-all ${
                  isDefault ? "border-brand-gold/25 bg-brand-dark" : "border-white/[0.08] bg-brand-dark"
                }`}
              >
                {isEditing ? (
                  <div>
                    <p className="mb-3 text-[10px] tracking-widest text-brand-pale-gold/60">editing address</p>
                    <AddressForm
                      initial={formInitial}
                      onSave={(form) => handleUpdate(addr.id, form, addr)}
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
                      {name && <p className="text-sm font-medium text-white">{name}</p>}
                      {addr.address1 && <p className="text-xs text-brand-grey/70">{addr.address1}</p>}
                      {addr.address2 && <p className="text-xs text-brand-grey/50">{addr.address2}</p>}
                      {line2 && <p className="text-xs text-brand-grey/50">{line2}</p>}
                      {addr.country && <p className="text-xs text-brand-grey/40">{addr.country}</p>}
                      {!isDefault && addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="mt-1 text-[11px] text-brand-grey/35 transition-colors hover:text-brand-gold"
                        >
                          set as default →
                        </button>
                      )}
                    </div>
                    <div className="flex flex-none gap-1">
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
