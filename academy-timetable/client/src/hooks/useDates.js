import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useToastStore } from "../store/useToastStore";

export const useDates = () =>
  useQuery({
    queryKey: ["dates"],
    queryFn: async () => {
      const { data } = await api.get("/api/dates");
      return Array.isArray(data) ? data : data?.dates || data?.data || [];
    }
  });

export const useCreateDate = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/dates", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates"] });
      pushToast({ title: "Date saved", message: "The date row was added.", tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Unable to add date",
        message: error?.response?.data?.error || "Please try again.",
        tone: "error"
      });
    }
  });
};

export const useCreateWeekDates = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/dates/week", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates"] });
      pushToast({ title: "Week added", message: "The week dates were created.", tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Unable to add week",
        message: error?.response?.data?.error || "Please try again.",
        tone: "error"
      });
    }
  });
};

export const useDeleteDateRow = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (date) => {
      const { data } = await api.delete(`/api/dates/by-date/${date}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      pushToast({ title: "Date row deleted", message: "The row and its slots were removed.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to delete date row", message: "Please try again.", tone: "error" });
    }
  });
};
