import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export const useConflicts = () =>
  useQuery({
    queryKey: ["conflicts"],
    queryFn: async () => {
      const { data } = await api.get("/api/conflicts");
      return data;
    }
  });
