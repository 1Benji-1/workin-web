import React, { useState, useEffect } from "react";
import { Button } from "@freelance/ui";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({
  initialValue = "",
  placeholder = "¿Qué servicio profesional estás buscando? (ej: diseño web, flutter, logo...)",
  onSearch,
  className = "",
}: SearchBarProps) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(val.trim());
  };

  const handleClear = () => {
    setVal("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full relative flex items-center ${className}`}>
      <div className="relative w-full flex items-center">
        <span className="absolute left-4 text-slate-400 text-lg pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-24 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {val && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 text-slate-400 hover:text-slate-600 p-1 text-xs"
            title="Borrar búsqueda"
          >
            ✕
          </button>
        )}
        <Button
          type="submit"
          size="md"
          className="absolute right-1.5 rounded-lg py-2 px-4 shadow-none"
        >
          Buscar
        </Button>
      </div>
    </form>
  );
}
