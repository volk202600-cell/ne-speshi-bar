@echo off
REM Start script for Windows
cd /d %~dp0
echo Installing backend dependencies...
cd backend
npm install
echo Starting backend...
node server.js
pause