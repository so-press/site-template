#!/bin/bash

# Define the path to the Git repository
repoPath="../../"

# Get all .hbs files modified in the last 3 days
files=$(git -C "$repoPath" log --since="3 days ago" --name-only --pretty=format: | grep '\.hbs$' | sort -u)

if [ -n "$files" ]; then
    for file in $files; do
        echo -e "\n### Diff for: $file ###\n"
        git -C "$repoPath" diff HEAD~ -- "$file"
        echo -e "\n----------------------------------------\n"
    done
else
    echo "No .hbs files modified in the last 3 days."
fi
