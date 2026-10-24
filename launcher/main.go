// MAD CITY 3D launcher: serves the embedded game on localhost and opens it
// in an app-style window (Edge / Chrome), so the whole game is one .exe file.
package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync/atomic"
	"time"
)

//go:embed all:game
var gameFiles embed.FS

func browserCandidates() []string {
	if runtime.GOOS != "windows" {
		return []string{"google-chrome", "chromium", "chromium-browser", "microsoft-edge", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
	}
	pf, pf86, local := os.Getenv("ProgramFiles"), os.Getenv("ProgramFiles(x86)"), os.Getenv("LOCALAPPDATA")
	var out []string
	for _, base := range []string{pf86, pf, local} {
		if base == "" {
			continue
		}
		out = append(out,
			filepath.Join(base, "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(base, "Google", "Chrome", "Application", "chrome.exe"),
			filepath.Join(base, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"))
	}
	return out
}

func findBrowser() string {
	for _, c := range browserCandidates() {
		if filepath.IsAbs(c) {
			if _, err := os.Stat(c); err == nil {
				return c
			}
		} else if p, err := exec.LookPath(c); err == nil {
			return p
		}
	}
	return ""
}

func main() {
	sub, err := fs.Sub(gameFiles, "game")
	if err != nil {
		panic(err)
	}
	var lastPing atomic.Int64
	lastPing.Store(time.Now().UnixNano())
	mux := http.NewServeMux()
	mux.HandleFunc("/__ping", func(w http.ResponseWriter, r *http.Request) {
		lastPing.Store(time.Now().UnixNano())
		w.WriteHeader(http.StatusNoContent)
	})
	mux.Handle("/", http.FileServer(http.FS(sub)))

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		fmt.Println("cannot listen:", err)
		os.Exit(1)
	}
	url := fmt.Sprintf("http://%s/", ln.Addr().String())
	go http.Serve(ln, mux)

	if os.Getenv("MADCITY_NOBROWSER") != "" {
		fmt.Println("serving on", url)
		select {}
	}

	if b := findBrowser(); b != "" {
		profile := filepath.Join(os.TempDir(), "MadCity3D-profile")
		if d, err := os.UserConfigDir(); err == nil {
			profile = filepath.Join(d, "MadCity3D", "profile")
		}
		cmd := exec.Command(b, "--app="+url, "--user-data-dir="+profile, "--window-size=1366,768",
			"--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist", "--enable-gpu-rasterization",
			"--disable-features=Translate", "--no-first-run", "--no-default-browser-check")
		if err := cmd.Start(); err == nil {
			cmd.Wait() // returns when the game window is closed
			return
		}
	}
	// fallback: default browser; quit when the page stops sending heartbeats
	switch runtime.GOOS {
	case "windows":
		exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		exec.Command("open", url).Start()
	default:
		exec.Command("xdg-open", url).Start()
	}
	for {
		time.Sleep(3 * time.Second)
		if time.Since(time.Unix(0, lastPing.Load())) > 25*time.Second {
			return
		}
	}
}
