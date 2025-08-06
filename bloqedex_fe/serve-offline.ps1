# Serve the application using a simple HTTP server
# This can be used when the Next.js development server is not running
# to simulate a server outage while still having the PWA available

Write-Host "Starting simple HTTP server for PWA testing..." -ForegroundColor Green
Write-Host ""
Write-Host "This simulates browsing the app when the main server is down" -ForegroundColor Yellow
Write-Host "You should still be able to navigate between cached pages" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red

# Use PowerShell to start a simple HTTP server on port 8080
try {
    # Check if Python is available (for a better HTTP server)
    $pythonAvailable = $null -ne (Get-Command python -ErrorAction SilentlyContinue)
    
    if ($pythonAvailable) {
        Write-Host "Using Python HTTP server on port 8080..." -ForegroundColor Cyan
        Write-Host "Access the app at: http://localhost:8080" -ForegroundColor Cyan
        cd public
        python -m http.server 8080
    } else {
        # Fallback to a simple PowerShell HTTP listener
        Write-Host "Using PowerShell HTTP listener on port 8080..." -ForegroundColor Cyan
        Write-Host "Access the app at: http://localhost:8080" -ForegroundColor Cyan
        
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:8080/")
        $listener.Start()
        
        Write-Host "Serving files from: $PWD\public" -ForegroundColor Cyan
        
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $requestUrl = $context.Request.Url.LocalPath
            $response = $context.Response
            
            # Serve index.html for root or unknown paths
            $filePath = Join-Path $PWD "public" $requestUrl.TrimStart("/")
            if (!(Test-Path $filePath) -or (Test-Path $filePath -PathType Container)) {
                $filePath = Join-Path $PWD "public" "index.html"
            }
            
            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch {
                Write-Host "Error serving file: $_" -ForegroundColor Red
                $response.StatusCode = 404
            } finally {
                $response.Close()
            }
            
            Write-Host "$($context.Request.HttpMethod) $requestUrl -> $($response.StatusCode)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
} finally {
    if ($listener -ne $null) {
        $listener.Stop()
    }
    Write-Host "Server stopped" -ForegroundColor Yellow
}
