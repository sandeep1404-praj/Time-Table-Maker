import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useToastStore } from "../store/useToastStore";

export const useTeachers = () =>
  useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data } = await api.get("/api/teachers");
      return Array.isArray(data) ? data : data?.teachers || data?.data || [];
    }
  });

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/teachers", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      pushToast({ title: "Teacher saved", message: "The teacher was added.", tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Unable to add teacher",
        message: error?.response?.data?.error || "Please check the form and try again.",
        tone: "error"
      });
    }
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/teachers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      pushToast({ title: "Teacher deleted", message: "The teacher was removed.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to delete teacher", message: "Please try again.", tone: "error" });
    }
  });
};

export const useAddTeacherChapter = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch(`/api/teachers/${id}/chapters`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      pushToast({ title: "Chapter added", message: "The chapter was added to the teacher.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to add chapter", message: "Please try again.", tone: "error" });
    }
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch(`/api/teachers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      pushToast({ title: "Teacher updated", message: "The teacher changes were saved.", tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Unable to update teacher",
        message: error?.response?.data?.error || "Please try again.",
        tone: "error"
      });
    }
  });
};

export const useUpdateTeacherChapter = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async ({ teacherId, chapterId, ...payload }) => {
      const { data } = await api.patch(
        `/api/teachers/${teacherId}/chapters/${chapterId}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      pushToast({ title: "Chapter updated", message: "The chapter changes were saved.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to update chapter", message: "Please try again.", tone: "error" });
    }
  });
};

export const useUpdateChapterBranchCompletion = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async ({ teacherId, chapterId, branchId, batchId, isCompleted }) => {
      const { data } = await api.patch(
        `/api/teachers/${teacherId}/chapters/${chapterId}/branch-completion`,
        { branchId, batchId, isCompleted }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      pushToast({ title: "Progress updated", message: "Chapter completion was saved.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to update progress", message: "Please try again.", tone: "error" });
    }
  });
};

export const useDeleteTeacherChapter = () => {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: async ({ teacherId, chapterId }) => {
      const { data } = await api.delete(
        `/api/teachers/${teacherId}/chapters/${chapterId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      pushToast({ title: "Chapter deleted", message: "The chapter was removed.", tone: "success" });
    },
    onError: () => {
      pushToast({ title: "Unable to delete chapter", message: "Please try again.", tone: "error" });
    }
  });
};
