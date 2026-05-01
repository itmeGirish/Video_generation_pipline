@echo off
REM ============================================
REM Video Explainer Pipeline Runner
REM ============================================
REM Usage:
REM   run_pipeline.bat <project_id> [--force] [--mock]
REM
REM Examples:
REM   run_pipeline.bat test_video --force
REM   run_pipeline.bat test_video --force --mock
REM ============================================

set PYTHONUTF8=1

cd /d "C:\Girish\Fundamental_Projects\video_generation\video_explainer"

python -m src.cli generate %*

echo.
echo Done! Check projects\%1\output\ for the video.
pause
