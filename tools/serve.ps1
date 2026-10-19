<#
  HYT website - local preview server for Windows (no Python or Node needed).
  Serves the hyt-website folder at http://localhost:8080/
  Start it by double-clicking start-website.bat in the project folder.
  Close the window to stop.
#>
param([int]$Port = 8080)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\hyt-website')).Path
$types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'
  '.json'='application/json; charset=utf-8'; '.xml'='application/xml; charset=utf-8'; '.txt'='text/plain; charset=utf-8'
  '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp'
  '.ico'='image/x-icon'; '.woff2'='font/woff2'; '.woff'='font/woff'; '.pdf'='application/pdf'
}
$langs = @('de-de','fr-fr','it-it','nl-nl','en-us')

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch {
  Write-Host "Could not start on port $Port. Is another program using it? Try: start-website.bat 8081" -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}
Write-Host ''
Write-Host "  HYT website preview running at  http://localhost:$Port/" -ForegroundColor Green
Write-Host "  Serving: $root"
Write-Host '  To stop: close this window.'
Write-Host ''
Start-Process "http://localhost:$Port/"

function Send-File($ctx, $file, $status) {
  $ext = [IO.Path]::GetExtension($file).ToLower()
  $ctype = $types[$ext]; if (-not $ctype) { $ctype = 'application/octet-stream' }
  $bytes = [IO.File]::ReadAllBytes($file)
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = $ctype
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path.Contains('..')) { $ctx.Response.StatusCode = 400; continue }
    $local = [IO.Path]::Combine($root, ($path.TrimStart('/') -replace '/', '\'))
    if (Test-Path $local -PathType Container) {
      if (-not $path.EndsWith('/')) {               # /products -> /products/
        $ctx.Response.Redirect($path + '/' + $ctx.Request.Url.Query); continue
      }
      $local = [IO.Path]::Combine($local, 'index.html')
    }
    if (Test-Path $local -PathType Leaf) {
      Send-File $ctx $local 200
      Write-Host "200 $path"
    } else {
      # language-specific 404 page, like the live server configuration
      $nf = Join-Path $root '404.html'
      foreach ($l in $langs) { if ($path.StartsWith("/$l/")) { $nf = [IO.Path]::Combine($root, $l, '404.html') } }
      Send-File $ctx $nf 404
      Write-Host "404 $path" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "Error: $_" -ForegroundColor Red
  } finally {
    $ctx.Response.OutputStream.Close()
  }
}
