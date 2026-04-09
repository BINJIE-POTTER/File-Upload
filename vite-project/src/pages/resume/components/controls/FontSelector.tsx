import { cn } from "@/lib/utils";

export interface FontOption {
  id: string;
  label: string;
  fontFamily: string;
}

interface FontSelectorProps {
  value: string;
  onChange: (id: string) => void;
  fonts: FontOption[];
}

export function FontSelector({ value, onChange, fonts }: FontSelectorProps) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-2">Font</label>
      <div className="flex gap-1">
        {fonts.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "flex-1 px-2 py-1.5 rounded text-xs transition-colors",
              value === f.id ? "bg-gray-100 font-medium text-gray-800" : "text-gray-500 hover:bg-gray-50"
            )}
            style={value === f.id ? { fontFamily: f.fontFamily } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}