@echo off
setlocal enabledelayedexpansion

REM Get the current folder
set "currentpath=%cd%"

REM Show the current folder and ask for confirmation
echo The current folder is: %currentpath%
set "choice="
set /p choice="Do you want to update in this folder? (Y/n): "

REM If user presses Enter, assume 'y'
if "%choice%"=="" set choice=Y

if /i "%choice%" neq "y" (
    echo Operation canceled.
    exit /b 0
)

REM Generate a random number for the temp folder
set /a randomNumber=%random%

REM Create a temp folder with a random number at the end
set "tempfolder=%TEMP%\site-template-update-%randomNumber%"
mkdir "%tempfolder%" || (
    echo Error: Could not create the temp folder.
    exit /b 1
)

REM Clone the repository into the temp folder and hide the output
git clone https://github.com/so-press/site-template.git "%tempfolder%" >nul 2>&1 || (
    echo Error: Failed to clone the repository.
    exit /b 1
)

REM Remove the 'src' folder from the temp folder
rmdir /s /q "%tempfolder%\src" || (
    echo Error: Failed to remove the 'src' folder from the temp folder.
    exit /b 1
)

REM Copy all files from the temp folder to the current folder, excluding the 'src' folder
xcopy /s /e /y "%tempfolder%\*" "%currentpath%"  >nul 2>&1 || (
    echo Error: Failed to copy files from the temp folder to the current folder.
    exit /b 1
)

REM Clean up by removing the temp folder
rmdir /s /q "%tempfolder%" || (
    echo Error: Failed to remove the temp folder.
    exit /b 1
)

echo Update completed successfully.
pause
exit /b 0
