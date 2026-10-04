@echo off
setlocal
cd /d "%~dp0"
start "SlotWise Backend" cmd /k "cd /d "%~dp0backend" && npm install && npm start"
start "SlotWise Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"
echo SlotWise is starting in two terminal windows.
echo Open the Vite URL printed in the frontend terminal, usually http://localhost:5173
pause
