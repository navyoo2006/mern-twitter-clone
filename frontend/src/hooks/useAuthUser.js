import { useQuery } from "@tanstack/react-query";

// Share the same query function with every auth observer, including cached reads.
const useAuthUser = () => useQuery({
    queryKey: ["authUser"],
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
        const res = await fetch("/api/auth/me", { signal });
        const data = await res.json();
        if (res.status === 401 || res.status === 404) return null;
        if (!res.ok) throw new Error(data.error || "Unable to check your session. Please try again.");
        return data;
    },
});

export default useAuthUser;
