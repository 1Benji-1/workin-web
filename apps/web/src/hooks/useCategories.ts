import { useEffect, useState, useCallback } from "react";
import type { Category } from "@freelance/types";
import { getCategories } from "@freelance/api";
import { supabase } from "../shared/lib/supabaseClient";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: catError } = await getCategories(supabase);
      if (catError) {
        setError(catError.message);
      } else if (data) {
        setCategories(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            icon: row.icon,
            createdAt: row.created_at,
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}
