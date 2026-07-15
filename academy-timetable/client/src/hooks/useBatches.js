import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useToastStore } from "../store/useToastStore";

export const useBatches = () =>
  useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data } = await api.get("/api/batches");
      return Array.isArray(data) ? data : data?.batches || data?.data || [];
    }
  });

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/batches", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      pushToast({ title: "Batch saved", message: "The batch was added.", tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Unable to add batch",
        message: error?.response?.data?.error || "Please try again.",
        tone: "error"
      });
    }
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/batches/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      pushToast({ title: "Batch deleted", message: "The batch was removed.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to delete batch", message: "Please try again.", tone: "error" });
    }
  });
};
