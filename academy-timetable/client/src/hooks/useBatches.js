import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export const useBatches = () =>
  useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data } = await api.get("/api/batches");
      return data;
    }
  });

export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/batches", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/batches/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    }
  });
};
