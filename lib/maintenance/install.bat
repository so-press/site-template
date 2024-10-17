@echo off
setlocal

:: Ask the user for the folder where they want to install the app
:askFolder
set /p "folder=Enter the folder where you want to install the app (folder is required): "
if "%folder%"=="" (
    echo Folder is required. Please try again.
    goto askFolder
)

:: Check if folder exists, if not, create it
if not exist "%folder%" (
    echo Folder does not exist. Creating it...
    mkdir "%folder%"
)

:: Download the ZIP file using curl
echo Downloading the file...
curl -L -o "%folder%\site-template-master.zip" "https://gitlab.com/SOPRESS/site-template/-/archive/master/site-template-master.zip"

:: Check if the download was successful
if not exist "%folder%\site-template-master.zip" (
    echo Failed to download the file.
    pause
    exit /b 1
)

:: Unzip the file
echo Unzipping the file...
powershell -Command "Expand-Archive -Path '%folder%\site-template-master.zip' -DestinationPath '%folder%'"

:: Clean up by deleting the ZIP file
echo Cleaning up...
del "%folder%\site-template-master.zip"

echo Done! The app has been installed in "%folder%".
pause
