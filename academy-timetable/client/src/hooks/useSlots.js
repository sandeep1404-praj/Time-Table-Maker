import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useTimetableStore } from "../store/useTimetableStore";
import { useToastStore } from "../store/useToastStore";

export const useSlots = () =>
  useQuery({
    queryKey: ["slots"],
    queryFn: async () => {
      const { data } = await api.get("/api/slots");
      return Array.isArray(data) ? data : data?.slots || data?.data || [];
    },
    refetchInterval: 60_000
  });

export const useCreateSlot = () => {
  const queryClient = useQueryClient();
  const setConflicts = useTimetableStore((state) => state.setConflicts);
  const setConflictMessage = useTimetableStore((state) => state.setConflictMessage);
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/slots", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setConflicts(data.conflicts || []);
      setConflictMessage("");
      pushToast({ title: "Slot saved", message: "The slot was created successfully.", tone: "success" });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Conflict detected.";
      const conflicts = error?.response?.data?.conflicts || [];
      setConflicts(conflicts);
      setConflictMessage(message);
      pushToast({ title: "Unable to save slot", message, tone: "error" });
    }
  });
};

export const useUpdateSlot = () => {
  const queryClient = useQueryClient();
  const setConflicts = useTimetableStore((state) => state.setConflicts);
  const setConflictMessage = useTimetableStore((state) => state.setConflictMessage);
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/api/slots/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setConflicts(data.conflicts || []);
      setConflictMessage("");
      pushToast({ title: "Slot updated", message: "The slot changes were saved.", tone: "success" });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Conflict detected.";
      const conflicts = error?.response?.data?.conflicts || [];
      setConflicts(conflicts);
      setConflictMessage(message);
      pushToast({ title: "Unable to update slot", message, tone: "error" });
    }
  });
};

export const useDeleteSlot = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/slots/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      pushToast({ title: "Slot deleted", message: "The slot was removed.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to delete slot", message: "Please try again.", tone: "error" });
    }
  });
};
