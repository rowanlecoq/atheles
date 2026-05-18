"use client";

import { useEffect, useRef } from "react";

type PlaceResult = {
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    function init() {
      if (!inputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        fields: ["address_components"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.address_components) return;
        const get = (type: string) =>
          place.address_components!.find((c) => c.types.includes(type))?.long_name ?? "";
        const getShort = (type: string) =>
          place.address_components!.find((c) => c.types.includes(type))?.short_name ?? "";
        const address1 = [get("street_number"), get("route")].filter(Boolean).join(" ");
        onPlaceSelect({
          address1,
          city: get("locality") || get("sublocality_level_1") || get("postal_town"),
          province: getShort("administrative_area_level_1"),
          zip: get("postal_code"),
          country: get("country"),
        });
        onChange(address1);
      });
    }

    if (window.google?.maps?.places) {
      init();
      return;
    }

    const existing = document.querySelector(`script[data-maps-key]`);
    if (!existing) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.dataset.mapsKey = "1";
      script.onload = init;
      document.head.appendChild(script);
    } else {
      const iv = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(iv); init(); }
      }, 100);
      return () => clearInterval(iv);
    }
  }, []);

  return (
    <input
      ref={inputRef}
      className={className}
      placeholder={placeholder ?? "Address line 1"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
    />
  );
}
