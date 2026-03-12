@echo off
echo Starting ThreadTrack Services...

:: Start Node Backend
start cmd /k "cd backend-node && npm run dev"

:: Start Python Backend
start cmd /k "cd backend-python && venn\Scripts\activate && python main.py"

:: Start Mobile (Expo)
start cmd /k "cd mobile && npx expo start"

echo All services launched in separate windows.
