import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export const useSlots = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['slots'],
    queryFn: () => API.get('/slots').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (slot) => API.post('/slots', slot).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries(['slots']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => API.put(`/slots/${id}`, data).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries(['slots']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/slots/${id}`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries(['slots']),
  });

  return { query, createMutation, updateMutation, deleteMutation };
};

export const useTimetableData = () => {
  const teachers = useQuery({
    queryKey: ['teachers'],
    queryFn: () => API.get('/teachers').then((res) => res.data),
  });

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: () => API.get('/batches').then((res) => res.data),
  });

  const batches = useQuery({
    queryKey: ['batches'],
    queryFn: () => API.get('/batches').then((res) => res.data),
  });

  return { teachers, branches, batches };
};

export const useTeacherTimetable = (teacherId) => {
  return useQuery({
    queryKey: ['timetable', 'teacher', teacherId],
    queryFn: () => API.get(`/timetable/teacher/${teacherId}`).then((res) => res.data),
    enabled: !!teacherId,
  });
};

export const useBatchTimetable = (batchId) => {
  return useQuery({
    queryKey: ['timetable', 'batch', batchId],
    queryFn: () => API.get(`/timetable/batch/${batchId}`).then((res) => res.data),
    enabled: !!batchId,
  });
};

export const useConflicts = () => {
  return useQuery({
    queryKey: ['conflicts'],
    queryFn: () => API.get('/conflicts').then((res) => res.data),
    refetchInterval: 5000,
  });
};

export const useExport = () => {
  return useMutation({
    mutationFn: () => API.get('/export/all-pdfs', { responseType: 'blob' }).then((res) => res.data),
  });
};
