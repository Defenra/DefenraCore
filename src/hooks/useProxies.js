import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch proxies list
export function useProxies() {
  return useQuery({
    queryKey: ["proxies"],
    queryFn: async () => {
      const res = await fetch("/api/proxy/list");
      if (!res.ok) throw new Error("Failed to fetch proxies");
      const data = await res.json();
      return data.proxies;
    },
  });
}

// Create proxy
export function useCreateProxy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/proxy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create proxy");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proxies"] });
    },
  });
}

// Update proxy (toggle active state)
export function useUpdateProxy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const res = await fetch(`/api/proxy/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update proxy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proxies"] });
    },
  });
}

// Delete proxy
export function useDeleteProxy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/proxy/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete proxy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proxies"] });
    },
  });
}
