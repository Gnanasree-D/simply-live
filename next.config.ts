import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server runtime is back (auth + sync endpoints). No more static export.

  // Old flat routes were merged into Today · Plan · Body · Progress.
  // Keep bookmarks / PWA shortcuts working.
  async redirects() {
    return [
      { source: "/journal", destination: "/plan/journal", permanent: false },
      { source: "/timetable", destination: "/plan/timetable", permanent: false },
      { source: "/todos", destination: "/plan/todos", permanent: false },
      { source: "/habits", destination: "/plan/habits", permanent: false },
      { source: "/goals", destination: "/plan/goals", permanent: false },
      { source: "/activity", destination: "/body/activity", permanent: false },
      { source: "/food", destination: "/body/food", permanent: false },
      { source: "/dashboard", destination: "/progress/dashboard", permanent: false },
      { source: "/insights", destination: "/progress/insights", permanent: false },
      { source: "/export", destination: "/progress/export", permanent: false },
    ];
  },
};

export default nextConfig;
