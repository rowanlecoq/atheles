"use client";

import { useEffect, useRef } from "react";

type PlaceResult = {
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
};

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect: _onPlaceSelect,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  className?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // No-op: native browser autocomplete handles address suggestions via
    // the autocomplete="address-line1" attribute set on the input below.
  }, []);

  return (
    <input
      ref={inputRef}
      className={className}
      placeholder={placeholder ?? "Address line 1"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="address-line1"
    />
  );
}
