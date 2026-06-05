import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export const useTeachers = () =>
  useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data } = await api.get("/api/teachers");
      return data;
    }
  });

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/teachers", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    }
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/teachers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    }
  });
};

export const useAddTeacherChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch(`/api/teachers/${id}/chapters`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    }
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch(`/api/teachers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    }
  });
};

export const useUpdateTeacherChapter = () => {
  const queryClient = useQueryClient();

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
    }
  });
};

export const useUpdateChapterBranchCompletion = () => {
  const queryClient = useQueryClient();

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
    }
  });
};

export const useDeleteTeacherChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teacherId, chapterId }) => {
      const { data } = await api.delete(
        `/api/teachers/${teacherId}/chapters/${chapterId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    }
  });
};
