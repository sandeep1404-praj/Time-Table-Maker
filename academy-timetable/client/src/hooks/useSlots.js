import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useTimetableStore } from "../store/useTimetableStore";

export const useSlots = () =>
  useQuery({
    queryKey: ["slots"],
    queryFn: async () => {
      const { data } = await api.get("/api/slots");
      return data;
    },
    refetchInterval: 60_000
  });

export const useCreateSlot = () => {
  const queryClient = useQueryClient();
  const setConflicts = useTimetableStore((state) => state.setConflicts);
  const setConflictMessage = useTimetableStore((state) => state.setConflictMessage);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/slots", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setConflicts(data.conflicts || []);
      setConflictMessage("");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Conflict detected.";
      const conflicts = error?.response?.data?.conflicts || [];
      setConflicts(conflicts);
      setConflictMessage(message);
    }
  });
};

export const useUpdateSlot = () => {
  const queryClient = useQueryClient();
  const setConflicts = useTimetableStore((state) => state.setConflicts);
  const setConflictMessage = useTimetableStore((state) => state.setConflictMessage);

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/api/slots/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setConflicts(data.conflicts || []);
      setConflictMessage("");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Conflict detected.";
      const conflicts = error?.response?.data?.conflicts || [];
      setConflicts(conflicts);
      setConflictMessage(message);
    }
  });
};

export const useDeleteSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/slots/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    }
  });
};
