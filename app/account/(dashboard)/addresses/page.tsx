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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className="address-input" placeholder="First name" value={form.firstName ?? ""} onChange={set("firstName")} />
        <input className="address-input" placeholder="Last name" value={form.lastName ?? ""} onChange={set("lastName")} />
      </div>
      <input className="address-input" placeholder="Address line 1" value={form.address1 ?? ""} onChange={set("address1")} />
      <input className="address-input" placeholder="Address line 2 (optional)" value={form.address2 ?? ""} onChange={set("address2")} />
      <div className="grid grid-cols-2 gap-3">
        <input className="address-input" placeholder="City" value={form.city ?? ""} onChange={set("city")} />
        <input className="address-input" placeholder="State / Province" value={form.province ?? ""} onChange={set("province")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="address-input" placeholder="ZIP / Postal code" value={form.zip ?? ""} onChange={set("zip")} />
        <input className="address-input" placeholder="Country" value={form.country ?? ""} onChange={set("country")} />
      </div>
      <input className="address-input" placeholder="Phone (optional)" value={form.phone ?? ""} onChange={set("phone")} />
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.address1?.trim() || !form.city?.trim()}
          className="flex items-center gap-1.5 rounded-full bg-brand-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : <><CheckIcon className="h-3.5 w-3.5" /> Save</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/50 transition-colors hover:border-white/30 hover:text-white"
        >
          Cancel
        </button>
      </div>
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
      .then((d) => {
        if (d) { setAddresses(d.addresses); setDefaultId(d.defaultAddressId); }
      })
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
    if (!r.ok) { setError(data.error || "failed to save"); setSaving(false); return; }
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
    if (!r.ok) { const d = await r.json(); setError(d.error || "failed to update"); setSaving(false); return; }
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
        <h2 className="font-heading text-2xl text-brand-light-gold">address book</h2>
        {!showAdd && (
          <button
            type="button"
            onClick={() => { setShowAdd(true); setEditId(null); setError(""); }}
            className="flex items-center gap-1.5 rounded-full border border-brand-dark-gold/30 px-3 py-1.5 text-xs uppercase tracking-wider text-brand-pale-gold transition-colors hover:border-brand-gold/60 hover:text-brand-gold"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add address
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-brand-dark-gold/5 border border-brand-dark-gold/10" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {showAdd && (
            <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4">
              <p className="mb-3 text-xs uppercase tracking-wider text-brand-pale-gold">new address</p>
              <AddressForm
                initial={EMPTY_FORM}
                onSave={handleAdd}
                onCancel={() => { setShowAdd(false); setError(""); }}
                saving={saving}
              />
            </div>
          )}

          {addresses.length === 0 && !showAdd && (
            <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
              <MapPinIcon className="mx-auto mb-3 h-10 w-10 text-brand-grey/30" />
              <p className="text-sm text-brand-pale-gold">no saved addresses yet.</p>
              <p className="mt-1 text-xs text-brand-grey">add an address to speed up checkout.</p>
            </div>
          )}

          {addresses.map((addr) => {
            const isDefault = addr.id === defaultId;
            const isEditing = editId === addr.id;
            const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
            return (
              <div
                key={addr.id}
                className={`rounded-lg border p-4 transition-colors ${isDefault ? "border-brand-gold/30 bg-brand-gold/5" : "border-brand-dark-gold/20 bg-brand-dark"}`}
              >
                {isEditing ? (
                  <>
                    <p className="mb-3 text-xs uppercase tracking-wider text-brand-pale-gold">edit address</p>
                    <AddressForm
                      initial={{ firstName: addr.firstName, lastName: addr.lastName, address1: addr.address1, address2: addr.address2, city: addr.city, province: addr.province, zip: addr.zip, country: addr.country, phone: addr.phone }}
                      onSave={(form) => handleUpdate(addr.id, form)}
                      onCancel={() => { setEditId(null); setError(""); }}
                      saving={saving}
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      {isDefault && (
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-brand-gold">
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Default
                        </div>
                      )}
                      {name && <p className="text-sm font-medium text-white">{name}</p>}
                      {addr.address1 && <p className="text-sm text-brand-grey">{addr.address1}</p>}
                      {addr.address2 && <p className="text-sm text-brand-grey">{addr.address2}</p>}
                      <p className="text-sm text-brand-grey">
                        {[addr.city, addr.province, addr.zip].filter(Boolean).join(", ")}
                      </p>
                      {addr.country && <p className="text-sm text-brand-grey">{addr.country}</p>}
                      {addr.phone && <p className="mt-1 text-xs text-brand-grey/60">{addr.phone}</p>}
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="mt-2 text-xs text-brand-grey/50 underline-offset-2 hover:text-brand-gold hover:underline transition-colors"
                        >
                          set as default
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditId(addr.id); setShowAdd(false); setError(""); }}
                        aria-label="Edit address"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        aria-label="Delete address"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {addresses.length > 0 && (
            <p className="pt-1 text-xs text-brand-grey/40">
              your default address will be pre-selected at checkout.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
