@echo off
setlocal enabledelayedexpansion

REM Ask for folder path
set "folder="
set /p folder="Enter the name of your project: (should be a slug) "

REM Check if folder is provided
if "%folder%"=="" (
    echo Error: You must provide a folder path.
    exit /b 1
)

REM Get the full path of the target folder
for %%I in ("%cd%\%folder%") do set fullpath=%%~fI

REM Show the full path to the user and ask for confirmation (default is Yes)
echo The app will installed in %fullpath%
set "choice="
set /p choice="Do you want to continue? (Y/n): "

REM If user presses Enter, assume 'y'
if "%choice%"=="" set choice=Y

if /i "%choice%" neq "y" (
    echo Operation canceled.
    exit /b 0
)

REM Check if the folder already exists
if exist "%fullpath%" (
    echo Error: The folder "%fullpath%" already exists.
    exit /b 1
)

REM Create the folder if it does not exist
mkdir "%fullpath%" || (
    echo Error: Could not create the folder.
    exit /b 1
)

REM Change to the target folder
cd "%fullpath%" || (
    echo Error: Failed to change to the target directory.
    exit /b 1
)

REM Clone the repository and hide the output
git clone https://github.com/so-press/site-template.git . >nul 2>&1 || (
    echo Error: Failed to clone the repository.
    exit /b 1
)

REM Remove the .git folder
rmdir /s /q .git || (
    echo Error: Failed to remove the .git folder.
    exit /b 1
)

echo Your app is ready.
echo You can now start to code by launching :
echo    cd %fullpath%
echo    npm install
echo    npm run dev
exit /b 0
