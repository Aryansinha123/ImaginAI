# Stable dev server (recommended on Windows — avoids reload KeyboardInterrupt)
Set-Location $PSScriptRoot
& .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
