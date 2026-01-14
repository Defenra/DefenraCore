import { useQuery } from "@tanstack/react-query";

export function useProxyClients(proxyId) {
  return useQuery({
    queryKey: ["proxyClients", proxyId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/${proxyId}/clients`);
      if (!res.ok) throw new Error("Failed to fetch proxy clients");
      return res.json();
    },
    enabled: !!proxyId,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });
}
