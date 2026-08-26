# AI Collaboration Context Logger
# This script captures session context from Kiro hooks and appends it to a log file.
# It reads JSON from stdin and logs timestamped entries.

$input_data = [Console]::In.ReadToEnd()
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$log_dir = Join-Path $PSScriptRoot "..\ai-collaboration"
$log_file = Join-Path $log_dir "session-log.md"

# Ensure the log directory exists
if (-not (Test-Path $log_dir)) {
    New-Item -ItemType Directory -Path $log_dir -Force | Out-Null
}

# Parse the JSON input
try {
    $session = $input_data | ConvertFrom-Json
    
    $entry = @"

---

## [$timestamp]

**Trigger:** $($session.trigger)
**Session ID:** $($session.sessionId)

### User Prompt
``````
$($session.userPrompt)
``````

### Context
- **Active File:** $($session.activeFile)
- **Open Files:** $($session.openFiles -join ', ')

"@

    # Append to log file
    Add-Content -Path $log_file -Value $entry -Encoding UTF8
    
    Write-Host "Session context logged successfully"
} catch {
    # If JSON parsing fails, log raw input
    $entry = @"

---

## [$timestamp]

**Trigger:** Raw input (parse error)

``````
$input_data
``````

"@
    Add-Content -Path $log_file -Value $entry -Encoding UTF8
    Write-Host "Raw session context logged"
}
