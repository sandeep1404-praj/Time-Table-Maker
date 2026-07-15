import { useEffect, useMemo, useRef, useState } from "react";

const normalizeOption = (option, getOptionLabel, getOptionValue) => {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  return {
    value: getOptionValue(option),
    label: getOptionLabel(option),
    meta: option
  };
};

const SearchableComboBox = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Search...",
  emptyLabel = "All",
  allowEmpty = true,
  compact = false,
  mode = "value",
  className = "",
  inputClassName = "form-input",
  panelClassName = "",
  getOptionLabel = (option) => option?.label ?? option?.name ?? String(option?.value ?? ""),
  getOptionValue = (option) => option?._id ?? option?.value ?? option?.id ?? getOptionLabel(option),
  helperText,
  noResultsText = "No matches found."
}) => {
  const rootRef = useRef(null);
  const [query, setQuery] = useState(mode === "text" ? String(value || "") : "");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const normalizedOptions = useMemo(
    () => options.map((option) => normalizeOption(option, getOptionLabel, getOptionValue)),
    [options, getOptionLabel, getOptionValue]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)),
    [normalizedOptions, value]
  );

  useEffect(() => {
    const syncQuery = mode === "text" ? String(value || "") : selectedOption?.label || "";
    setQuery(syncQuery);
  }, [mode, value, selectedOption?.label]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const filteredOptions = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) => {
      const label = String(option.label || "").toLowerCase();
      const optionValue = String(option.value || "").toLowerCase();
      return label.includes(trimmedQuery) || optionValue.includes(trimmedQuery);
    });
  }, [normalizedOptions, query]);

  const displayOptions = useMemo(() => {
    const list = allowEmpty && mode === "value" ? [{ value: "", label: emptyLabel, isEmpty: true }] : [];
    return [...list, ...filteredOptions];
  }, [allowEmpty, emptyLabel, filteredOptions, mode]);

  const selectOption = (option) => {
    if (!option) return;
    if (option.isEmpty) {
      onChange?.("");
      setQuery("");
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }

    const nextValue = mode === "text" ? option.label : option.value;
    onChange?.(nextValue);
    setQuery(option.label);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setOpen(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => Math.min(current + 1, displayOptions.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      if (open && highlightIndex >= 0 && displayOptions[highlightIndex]) {
        event.preventDefault();
        selectOption(displayOptions[highlightIndex]);
      }
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setOpen(true);
          setHighlightIndex(-1);
          if (mode === "text") {
            onChange?.(nextQuery);
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
      />

      {open && displayOptions.length > 0 && (
        <div
          className={`absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl ${panelClassName}`}
          role="listbox"
        >
          {displayOptions.map((option, index) => (
            <button
              key={`${option.value || option.label || index}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-indigo-50 ${
                highlightIndex === index ? "bg-indigo-50" : ""
              }`}
              role="option"
              aria-selected={highlightIndex === index}
            >
              <span className="font-medium text-slate-800">{option.label}</span>
              {option.isEmpty ? null : option.meta?.subject ? (
                <span className="text-xs text-slate-500">{option.meta.subject}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && displayOptions.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-xl">
          {noResultsText}
        </div>
      )}

      {mode === "value" && selectedOption && helperText ? (
        <p className={`${compact ? "mt-1" : "mt-1.5"} text-xs text-slate-500`}>{helperText}</p>
      ) : null}
    </div>
  );
};

export default SearchableComboBox;