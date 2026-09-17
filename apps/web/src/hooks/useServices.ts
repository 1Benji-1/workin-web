import { useEffect, useState, useCallback } from "react";
import type { ServiceWithFreelancer, ServiceFilterParams } from "@freelance/types";
import { getServices } from "@freelance/api";
import { supabase } from "../shared/lib/supabaseClient";

interface RawServiceItem {
  id: string;
  freelancer_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number | string;
  delivery_days: number;
  cover_image: string | null;
  status: string;
  rating: number | string;
  reviews_count: number;
  created_at: string;
  updated_at: string;
  freelancer?: {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    headline?: string | null;
    skills?: string[] | null;
  } | null;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
    icon?: string | null;
  } | null;
}

export function useServices(filters: ServiceFilterParams = {}) {
  const {
    searchQuery,
    categorySlug,
    minPrice,
    maxPrice,
    maxDeliveryDays,
    minRating,
    freelancerId,
  } = filters;

  const [services, setServices] = useState<ServiceWithFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: ServiceFilterParams = {
        searchQuery,
        categorySlug,
        minPrice,
        maxPrice,
        maxDeliveryDays,
        minRating,
        freelancerId,
      };

      const { data, error: sError } = await getServices(supabase, activeFilters);
      if (sError) {
        setError(sError.message);
      } else if (data) {
        const rawItems = data as unknown as RawServiceItem[];
        const mapped: ServiceWithFreelancer[] = rawItems.map((item) => ({
          id: item.id,
          freelancerId: item.freelancer_id,
          categoryId: item.category_id,
          title: item.title,
          description: item.description,
          price: Number(item.price),
          deliveryDays: item.delivery_days,
          coverImage: item.cover_image,
          status: item.status as "active" | "paused" | "draft",
          rating: Number(item.rating),
          reviewsCount: item.reviews_count,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          freelancer: {
            id: item.freelancer?.id || item.freelancer_id,
            fullName: item.freelancer?.full_name || "Freelancer",
            avatarUrl: item.freelancer?.avatar_url || null,
            headline: item.freelancer?.headline || null,
            skills: item.freelancer?.skills || [],
          },
          category: {
            id: item.category?.id || item.category_id,
            name: item.category?.name || "General",
            slug: item.category?.slug || "",
            icon: item.category?.icon || "💼",
          },
        }));

        setServices(mapped);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    categorySlug,
    minPrice,
    maxPrice,
    maxDeliveryDays,
    minRating,
    freelancerId,
  ]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}
