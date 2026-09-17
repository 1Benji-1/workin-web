import React, { useState } from "react";
import { Badge, Button } from "@freelance/ui";

interface SkillsTagsProps {
  skills: string[];
  onChange: (newSkills: string[]) => void;
}

const COMMON_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Flutter",
  "Supabase",
  "Node.js",
  "UI/UX Design",
  "Figma",
  "PostgreSQL",
  "Python",
];

export function SkillsTags({ skills, onChange }: SkillsTagsProps) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...skills, trimmed]);
    setInputVal("");
  };

  const handleRemove = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd(inputVal);
    }
  };

  const unusedSuggestions = COMMON_SUGGESTIONS.filter(
    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Escribe una habilidad (ej: React, Flutter) y presiona Enter"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleAdd(inputVal)}
          disabled={!inputVal.trim()}
        >
          Añadir
        </Button>
      </div>

      {/* Lista de habilidades añadidas */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {skills.map((skill) => (
            <Badge key={skill} variant="neutral" className="pl-3 pr-1.5 py-1 text-xs bg-slate-100 text-slate-800 flex items-center gap-1.5">
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemove(skill)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-200 transition-colors"
                title={`Eliminar ${skill}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No has agregado ninguna habilidad aún.</p>
      )}

      {/* Sugerencias rápidas */}
      {unusedSuggestions.length > 0 && (
        <div className="pt-1">
          <span className="text-xs text-slate-500 mr-2">Sugerencias:</span>
          <div className="inline-flex flex-wrap gap-1.5 align-middle">
            {unusedSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAdd(suggestion)}
                className="text-xs px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
