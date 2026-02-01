import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  placeholder,
  className,
  icon
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.length > 2 && showSuggestions) {
        setLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              value
            )}&addressdetails=1&limit=5`
          );
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error("Autocomplete error:", error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else if (value.length <= 2) {
        setSuggestions([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [value, showSuggestions]);

  const handleSelect = (suggestion: Suggestion) => {
    // We only use the display name for the input value
    // In a more complex scenario, we might want to pass the whole suggestion object up
    onChange(suggestion.display_name);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => {
             onChange(e.target.value);
             setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className={cn(icon && "pl-10", className)}
          onFocus={() => {
              if (value.length > 2) setShowSuggestions(true);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto py-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-start gap-2"
              onClick={() => handleSelect(suggestion)}
            >
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="line-clamp-2">{suggestion.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
