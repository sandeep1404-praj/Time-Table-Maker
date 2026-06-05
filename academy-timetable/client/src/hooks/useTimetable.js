import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export const useTeacherTimetable = (teacherId) =>
  useQuery({
    queryKey: ["timetable", "teacher", teacherId],
    queryFn: async () => {
      const { data } = await api.get(`/api/timetable/teacher/${teacherId}`);
      return data;
    },
    enabled: Boolean(teacherId)
  });

export const useBatchTimetable = (batchId) =>
  useQuery({
    queryKey: ["timetable", "batch", batchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/timetable/batch/${batchId}`);
      return data;
    },
    enabled: Boolean(batchId)
  });
