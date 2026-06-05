import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export const useArchives = () =>
  useQuery({
    queryKey: ["archives"],
    queryFn: async () => {
      const { data } = await api.get("/api/archives");
      return data;
    }
  });

export const useArchiveData = (archiveId) =>
  useQuery({
    queryKey: ["archive-data", archiveId],
    queryFn: async () => {
      const [{ data: dates }, { data: slots }] = await Promise.all([
        api.get(`/api/dates?archiveId=${archiveId}`),
        api.get(`/api/slots?archiveId=${archiveId}`)
      ]);
      return { dates, slots };
    },
    enabled: Boolean(archiveId)
  });

export const useDeleteArchive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (archiveId) => {
      await api.delete(`/api/archives/${archiveId}`);
    },
    onSuccess: (_data, archiveId) => {
      queryClient.invalidateQueries({ queryKey: ["archives"] });
      queryClient.removeQueries({ queryKey: ["archive-data", archiveId] });
    }
  });
};
