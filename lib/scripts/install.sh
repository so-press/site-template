#!/bin/bash

# Ask for folder path
read -p "Enter the name of your project (should be a slug): " folder

# Check if folder is provided
if [ -z "$folder" ]; then
    echo "Error: You must provide a folder path."
    exit 1
fi

# Get the full path of the target folder
fullpath="$(pwd)/$folder"

# Show the full path to the user and ask for confirmation (default is Yes)
echo "The app will be installed in $fullpath"
read -p "Do you want to continue? (Y/n): " choice

# If user presses Enter, assume 'y'
choice=${choice:-Y}

if [[ ! "$choice" =~ ^[Yy]$ ]]; then
    echo "Operation canceled."
    exit 0
fi

# Check if the folder already exists
if [ -d "$fullpath" ]; then
    echo "Error: The folder \"$fullpath\" already exists."
    exit 1
fi

# Create the folder if it does not exist
mkdir -p "$fullpath" || {
    echo "Error: Could not create the folder."
    exit 1
}

# Change to the target folder
cd "$fullpath" || {
    echo "Error: Failed to change to the target directory."
    exit 1
}

# Clone the repository and hide the output
git clone git@github.com:so-press/site-template.git . >/dev/null 2>&1 || {
    echo "Error: Failed to clone the repository."
    exit 1
}

# Remove the .git folder
rm -rf .git || {
    echo "Error: Failed to remove the .git folder."
    exit 1
}

echo "Your app is ready."
echo "You can now start to code by launching:"
echo "   cd $fullpath"
echo "   npm install"
echo "   npm run dev"
