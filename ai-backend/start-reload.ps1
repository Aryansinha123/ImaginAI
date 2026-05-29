# Hot reload with delay (slower restarts; use start.ps1 if reload keeps failing)
Set-Location $PSScriptRoot
& .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload --reload-delay 3
