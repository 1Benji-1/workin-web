import React, { useState, useEffect } from "react";
import { Button } from "@freelance/ui";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string, shouldScroll?: boolean) => void;
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
    onSearch(val.trim(), true);
  };

  const handleClear = () => {
    setVal("");
    onSearch("", false);
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full relative flex items-center ${className}`}>
      <div className="relative w-full flex items-center">
        <span className="absolute left-4 sm:left-5 text-slate-400 text-lg sm:text-xl pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-slate-200 bg-white py-4 sm:py-4.5 pl-12 sm:pl-14 pr-28 sm:pr-36 text-sm sm:text-base text-[#1F363D] shadow-md placeholder:text-slate-400 focus:border-[#40798C] focus:outline-none focus:ring-4 focus:ring-[#40798C]/20 transition-all"
        />
        {val && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 sm:right-32 text-slate-400 hover:text-slate-600 p-1 text-xs sm:text-sm cursor-pointer"
            title="Borrar búsqueda"
          >
            ✕
          </button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="absolute right-2 sm:right-2.5 rounded-full py-2.5 sm:py-3 px-5 sm:px-8 font-bold text-sm sm:text-base shadow-xs"
        >
          Buscar
        </Button>
      </div>
    </form>
  );
}
