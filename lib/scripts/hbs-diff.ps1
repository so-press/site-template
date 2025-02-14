param (
    [string[]]$ignore
)

# Get the directory where the script is located
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoPath = Resolve-Path "$scriptPath/../../"

# Get commit hashes that modified .hbs files in the last 3 days
$commits = git -C $repoPath log --since="4 days ago" --pretty=format:"%H"

if ($commits) {
    foreach ($commit in $commits) {
        # Get .hbs files modified in this commit
        $files = git -C $repoPath diff-tree --no-commit-id --name-only -r $commit | Where-Object { $_ -match '\.hbs$' }

        # Filter out ignored files
        $filteredFiles = @()
        foreach ($file in $files) {
            $shouldIgnore = $false
            foreach ($ignoreItem in $ignore) {
                if ($file -match [regex]::Escape($ignoreItem)) {
                    $shouldIgnore = $true
                    break
                }
            }
            if (-not $shouldIgnore) {
                $filteredFiles += $file
            }
        }

        # Display diffs for filtered files
        if ($filteredFiles.Count -gt 0) {
            Write-Output "`n### Commit: $commit ###`n"
            foreach ($file in $filteredFiles) {
                Write-Output "`n--- Diff for: $file in commit $commit ---`n"
                $env:GIT_PAGER = "cat"  # Disable Git pagination
                git -C $repoPath show $commit -- $file
                Write-Output "`n----------------------------------------`n"
            }
        }
    }
}
else {
    Write-Output "No .hbs files modified in the last 3 days."
}
