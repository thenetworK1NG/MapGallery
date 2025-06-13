@echo off
echo Starting Image Gallery Server...
echo.

REM Check if Maven is installed
mvn --version > nul 2>&1
if errorlevel 1 (
    echo Maven is not installed or not in PATH!
    echo Please install Maven from https://maven.apache.org/download.cgi
    echo and add it to your system PATH
    pause
    exit /b 1
)

REM Check if images folder exists, create if it doesn't
if not exist "images" (
    echo Creating images folder...
    mkdir images
    echo Please add your images to the 'images' folder
)

echo Starting the server...
echo The gallery will be available at http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

mvn spring-boot:run

pause 