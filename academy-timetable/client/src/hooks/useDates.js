import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export const useDates = () =>
  useQuery({
    queryKey: ["dates"],
    queryFn: async () => {
      const { data } = await api.get("/api/dates");
      return data;
    }
  });

export const useCreateDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/dates", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates"] });
    }
  });
};

export const useCreateWeekDates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/dates/week", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates"] });
    }
  });
};

export const useDeleteDateRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date) => {
      const { data } = await api.delete(`/api/dates/by-date/${date}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    }
  });
};
