"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// Debounce delay: long enough to skip firing a request on every single keystroke while
// someone's still typing, short enough that suggestions still feel responsive.
const DEBOUNCE_MS = 300;

export interface AutocompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  fetchSuggestions: (query: string) => Promise<string[]>;
  placeholder?: string;
  className?: string;
  // Below this many (trimmed) characters, no request is made and the dropdown stays
  // closed -- callers with a scoped/narrowed search (e.g. song search once an artist is
  // already chosen) can lower this since even one character meaningfully narrows results.
  minChars?: number;
}

// A plain text input that also shows a dropdown of suggestions as the person types,
// without ever requiring one to be picked -- every failure mode (the fetch rejects,
// returns nothing, or the API is unreachable) just means an empty dropdown, and the input
// keeps working exactly like a normal text field. See docs/DESIGN_SYSTEM.md's Inputs
// component spec (white background, soft border, rounded corners) -- this component only
// adds the dropdown; the input's own visual styling is still controlled by the caller's
// `className`, same as a plain <input>.
export function AutocompleteInput({
  id,
  value,
  onChange,
  fetchSuggestions,
  placeholder,
  className,
  minChars = 2,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against an earlier, slower request's response landing after a later one's --
  // without this, a fast final keystroke's empty-result response could be overwritten by a
  // stale, out-of-order response for an earlier, longer query.
  const requestIdRef = useRef(0);
  // Always holds the latest fetchSuggestions without needing it in the debounce effect's
  // dependency array -- avoids refiring/resetting the debounce timer on every parent
  // render just because the caller passed a fresh inline arrow function.
  const fetchSuggestionsRef = useRef(fetchSuggestions);
  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions;
  }, [fetchSuggestions]);
  // Set right before selectSuggestion() calls onChange() -- without this, the value change
  // from picking a suggestion re-triggers the debounce effect below (value is a dependency),
  // which fetches again for the now-selected text and reopens the dropdown ~300ms after the
  // user just closed it by choosing something. Checked and cleared at the top of that effect,
  // so it only ever suppresses the one fetch cycle caused by a selection, never a real keystroke.
  const suppressNextFetchRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      requestIdRef.current++; // also invalidate any request already in flight from before the selection
      return;
    }

    const query = value.trim();
    // No setState here for the "too short" case -- `shouldShowDropdown` below derives
    // visibility from `value`/`minChars` directly at render time instead, so a query
    // shrinking below the minimum doesn't need an effect to reactively clear state. Still
    // bump requestIdRef, though: without it, an earlier request already in flight when the
    // query shrank could resolve later and populate stale suggestions right as the query
    // grows back above minChars, before the new debounced request for it returns.
    if (query.length < minChars) {
      requestIdRef.current++;
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      fetchSuggestionsRef
        .current(query)
        .then((results) => {
          if (thisRequestId !== requestIdRef.current) return; // superseded by a later keystroke
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setHighlightedIndex(-1);
        })
        .catch(() => {
          if (thisRequestId !== requestIdRef.current) return;
          setSuggestions([]);
          setIsOpen(false);
          setHighlightedIndex(-1);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, minChars]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectSuggestion(suggestion: string) {
    suppressNextFetchRef.current = true;
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
  }

  // Derived, not stored: a query that's shrunk back below minChars should hide the
  // dropdown even if `isOpen`/`suggestions` haven't been reset yet (see the effect above).
  const shouldShowDropdown = isOpen && suggestions.length > 0 && value.trim().length >= minChars;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!shouldShowDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter") {
      // Always prevent the default (form-submitting) behavior while the dropdown is open,
      // even with nothing highlighted -- otherwise a stray Enter while suggestions are
      // visible silently submits whatever raw text is currently typed instead of being a
      // no-op, since this component sits inside the hero's <form>.
      event.preventDefault();
      if (highlightedIndex >= 0) {
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  const listboxId = `${id}-listbox`;

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        // Closes the dropdown for keyboard users tabbing away, not just mouse clicks
        // outside it (the separate document-level mousedown listener below). Safe to fire
        // unconditionally: a suggestion click's onMouseDown already calls preventDefault(),
        // which stops the input from blurring at all, so this can never race a real selection.
        onBlur={() => setIsOpen(false)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={shouldShowDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined}
        autoComplete="off"
        className={className}
      />
      {shouldShowDropdown ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-foreground/10 bg-background py-1 text-left shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              // onMouseDown (not onClick) fires before the input's onBlur, so selecting a
              // suggestion by clicking doesn't first close the dropdown out from under it.
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`cursor-pointer px-4 py-2 text-sm ${
                index === highlightedIndex ? "bg-foreground/5 text-foreground" : "text-foreground/80"
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
