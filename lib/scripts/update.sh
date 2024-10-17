#!/bin/bash

# Get the current folder
currentpath=$(pwd)

# Show the current folder and ask for confirmation
echo "The current folder is: $currentpath"
read -p "Do you want to update in this folder? (Y/n): " choice

# If user presses Enter, assume 'y'
choice=${choice:-Y}

if [[ ! "$choice" =~ ^[Yy]$ ]]; then
    echo "Operation canceled."
    exit 0
fi

# Generate a random number for the temp folder
randomNumber=$RANDOM

# Create a temp folder with a random number at the end
tempfolder="/tmp/site-template-update-$randomNumber"
mkdir -p "$tempfolder" || {
    echo "Error: Could not create the temp folder."
    exit 1
}

# Clone the repository into the temp folder and hide the output
git clone https://github.com/so-press/site-template.git "$tempfolder" >/dev/null 2>&1 || {
    echo "Error: Failed to clone the repository."
    exit 1
}

# Remove the 'src' folder from the temp folder
rm -rf "$tempfolder/src" || {
    echo "Error: Failed to remove the 'src' folder from the temp folder."
    exit 1
}

# Copy all files from the temp folder to the current folder, excluding the 'src' folder
rsync -a --exclude="src" "$tempfolder/" "$currentpath/" || {
    echo "Error: Failed to copy files from the temp folder to the current folder."
    exit 1
}

# Clean up by removing the temp folder
rm -rf "$tempfolder" || {
    echo "Error: Failed to remove the temp folder."
    exit 1
}

echo "Update completed successfully."
