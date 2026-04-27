"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

type LocationSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

type LocationAutocompleteProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export function LocationAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  placeholder = "Enter city, state, country",
  disabled
}: LocationAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  const query = value.trim();
  const shouldSearch = query.length >= 3;

  useEffect(() => {
    if (!shouldSearch) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`,
          {
            method: "GET",
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const rows = (await response.json()) as NominatimResult[];
        const mapped = rows
          .map((row) => {
            const latitude = Number(row.lat);
            const longitude = Number(row.lon);
            const labelValue = row.display_name?.trim() ?? "";

            if (!labelValue || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            return {
              label: labelValue,
              latitude,
              longitude
            };
          })
          .filter((row): row is LocationSuggestion => Boolean(row));

        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, shouldSearch]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const showDropdown = open && shouldSearch && (loading || suggestions.length > 0);
  const helperText = useMemo(() => {
    if (!shouldSearch) {
      return "Type at least 3 characters to search locations.";
    }
    if (loading) {
      return "Searching locations...";
    }
    if (suggestions.length === 0) {
      return "No suggestions found.";
    }
    return null;
  }, [loading, shouldSearch, suggestions.length]);

  return (
    <div ref={containerRef} className="relative md:col-span-2">
      <label className="text-xs text-muted">{label}</label>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-panelAlt px-3 py-2">
        <MapPin className="h-4 w-4 text-muted" />
        <input
          value={value}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-text outline-none"
        />
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
      </div>
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-64 overflow-y-auto rounded-lg border border-line bg-panel shadow-xl">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
                setOpen(false);
              }}
              className="w-full border-b border-line px-3 py-2 text-left text-sm text-text transition last:border-b-0 hover:bg-panelAlt"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
