import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MasterGrid } from './components/MasterGrid';
import { TeacherView } from './components/TeacherView';
import { BatchView } from './components/BatchView';
import { ExportButton } from './components/ExportButton';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-blue-600 text-white p-4 shadow">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold">Academy Timetable</h1>
              <div className="flex gap-4">
                <Link to="/" className="hover:underline">Master Grid</Link>
                <Link to="/teacher" className="hover:underline">Teacher View</Link>
                <Link to="/batch" className="hover:underline">Batch View</Link>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/teacher" element={<TeacherView />} />
              <Route path="/batch" element={<BatchView />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton />
      </div>
      <MasterGrid />
    </div>
  );
}

export default App;
