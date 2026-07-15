import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useToastStore } from "../store/useToastStore";

export const useBranches = () =>
  useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get("/api/branches");
      return Array.isArray(data) ? data : data?.branches || data?.data || [];
    }
  });

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/branches", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      pushToast({ title: "Branch saved", message: "The branch was added.", tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Unable to add branch",
        message: error?.response?.data?.error || "Please try again.",
        tone: "error"
      });
    }
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/branches/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      pushToast({ title: "Branch deleted", message: "The branch was removed.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to delete branch", message: "Please try again.", tone: "error" });
    }
  });
};
