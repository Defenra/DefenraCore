import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch domains list
export function useDomains() {
  return useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const res = await fetch("/api/domain/list");
      if (!res.ok) throw new Error("Failed to fetch domains");
      const data = await res.json();
      return data.domains;
    },
  });
}

// Fetch single domain
export function useDomain(id) {
  return useQuery({
    queryKey: ["domains", id],
    queryFn: async () => {
      const res = await fetch(`/api/domain/${id}`);
      if (!res.ok) throw new Error("Failed to fetch domain");
      const data = await res.json();
      return data.domain;
    },
    enabled: !!id,
  });
}

// Create domain
export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/domain/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}

// Update domain
export function useUpdateDomain(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/domain/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains", id] });
    },
  });
}

// Delete domain
export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/domain/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete domain");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}

// Migrate domains (add default GeoDNS locations)
export function useMigrateDomains() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/domain/migrate", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to migrate domains");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}
