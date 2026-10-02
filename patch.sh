#!/bin/bash
# Run from inside your existing ~/resumeiq folder after copying the update files over
set -e
cd frontend/src

# api.js: allow a deployed backend URL
sed -i "s|const BASE = '/api';|const BASE = import.meta.env.VITE_API_URL \|\| '/api';|" lib/api.js

# Dashboard: "/jobs" is now the public board, company jobs live at /my-jobs
sed -i 's|to="/jobs"|to="/my-jobs"|g' pages/Dashboard.jsx

# JobDetail: breadcrumb back-link
sed -i 's|to="/jobs"|to="/my-jobs"|g' pages/JobDetail.jsx

echo "Patched: api.js, Dashboard.jsx, JobDetail.jsx"
