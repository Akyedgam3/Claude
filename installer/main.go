// Mad City 3D — Windows installer / uninstaller.
// A self-contained setup wizard: it embeds the game, serves a wizard UI on localhost and shows it
// in an app-style Edge/Chrome window. No admin rights needed (per-user install).
package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

//go:embed all:payload
var payload embed.FS

//go:embed ui/index.html ui/icon.png
var uiFS embed.FS

var version = "1.0.0"

const (
	appName   = "Mad City 3D"
	appFolder = "MadCity3D"
	regKey    = `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\MadCity3D`
	gameExe   = "MadCity.exe"
	unExe     = "uninstall.exe"
)

type status struct {
	mu     sync.Mutex
	Pct    int      `json:"pct"`
	Msg    string   `json:"msg"`
	Log    []string `json:"log"`
	Done   bool     `json:"done"`
	Error  string   `json:"error"`
	Active bool     `json:"active"`
}

func (s *status) set(p int, m string) {
	s.mu.Lock()
	s.Pct, s.Msg = p, m
	s.Log = append(s.Log, m)
	s.mu.Unlock()
}
func (s *status) snapshot() map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()
	return map[string]any{"pct": s.Pct, "msg": s.Msg, "log": append([]string(nil), s.Log...), "done": s.Done, "error": s.Error, "active": s.Active}
}

var st = &status{}

func (s *status) resetLocked() { s.Pct, s.Msg, s.Log, s.Done, s.Error, s.Active = 0, "", nil, false, "", true }

func defaultDir() string {
	if runtime.GOOS == "windows" {
		if l := os.Getenv("LOCALAPPDATA"); l != "" {
			return filepath.Join(l, "Programs", appFolder)
		}
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, ".local", "share", appFolder)
}

func payloadSize() int64 {
	var n int64
	fs2, err := payload.Open("payload/" + gameExe)
	if err == nil {
		if fi, e := fs2.Stat(); e == nil {
			n = fi.Size()
		}
		fs2.Close()
	}
	return n
}

type installOpts struct {
	Dir       string `json:"dir"`
	Desktop   bool   `json:"desktop"`
	StartMenu bool   `json:"startmenu"`
}

func doInstall(o installOpts) {
	defer func() {
		if r := recover(); r != nil {
			st.mu.Lock()
			st.Error = fmt.Sprint(r)
			st.Active = false
			st.mu.Unlock()
		}
	}()
	fail := func(err error) {
		st.mu.Lock()
		st.Error = err.Error()
		st.Active = false
		st.mu.Unlock()
	}
	st.set(3, "تجهيز مجلد التثبيت: "+o.Dir)
	if err := os.MkdirAll(o.Dir, 0o755); err != nil {
		fail(err)
		return
	}
	stopGame()
	// copy the game executable in chunks so the bar moves
	src, err := payload.Open("payload/" + gameExe)
	if err != nil {
		fail(err)
		return
	}
	fi, _ := src.Stat()
	total := fi.Size()
	dst, err := os.Create(filepath.Join(o.Dir, gameExe))
	if err != nil {
		fail(fmt.Errorf("تعذّر الكتابة (هل اللعبة قيد التشغيل؟): %w", err))
		return
	}
	st.set(8, "نسخ ملفات اللعبة...")
	buf := make([]byte, 256*1024)
	var done int64
	for {
		n, rerr := src.Read(buf)
		if n > 0 {
			if _, werr := dst.Write(buf[:n]); werr != nil {
				fail(werr)
				return
			}
			done += int64(n)
			st.mu.Lock()
			st.Pct = 8 + int(float64(done)/float64(total)*70)
			st.mu.Unlock()
			time.Sleep(12 * time.Millisecond)
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			fail(rerr)
			return
		}
	}
	dst.Close()
	os.Chmod(filepath.Join(o.Dir, gameExe), 0o755)
	src.Close()
	st.set(80, "إنشاء برنامج الإزالة...")
	if self, err := os.Executable(); err == nil {
		if err := copyFile(self, filepath.Join(o.Dir, unExe)); err != nil {
			st.set(82, "تعذّر إنشاء uninstall.exe: "+err.Error())
		}
	}
	if runtime.GOOS == "windows" {
		st.set(86, "إنشاء الاختصارات...")
		makeShortcuts(o)
		st.set(94, "تسجيل البرنامج في «التطبيقات المثبتة»...")
		registerUninstall(o.Dir, total)
	}
	st.mu.Lock()
	st.Pct, st.Done, st.Active = 100, true, false
	st.Log = append(st.Log, "اكتمل التثبيت ✔")
	st.Msg = "اكتمل التثبيت"
	st.mu.Unlock()
}

func copyFile(a, b string) error {
	if strings.EqualFold(a, b) {
		return nil
	}
	in, err := os.Open(a)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(b)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	os.Chmod(b, 0o755)
	return err
}

func psq(s string) string { return strings.ReplaceAll(s, "'", "''") }

func makeShortcuts(o installOpts) {
	exe := filepath.Join(o.Dir, gameExe)
	var b strings.Builder
	b.WriteString(`$w=New-Object -ComObject WScript.Shell;`)
	mk := func(folderExpr, name string) {
		fmt.Fprintf(&b, `$d=%s;New-Item -ItemType Directory -Force -Path $d | Out-Null;$s=$w.CreateShortcut((Join-Path $d '%s.lnk'));$s.TargetPath='%s';$s.WorkingDirectory='%s';$s.Description='%s';$s.IconLocation='%s,0';$s.Save();`,
			folderExpr, psq(name), psq(exe), psq(o.Dir), psq(appName), psq(exe))
	}
	if o.Desktop {
		mk(`[Environment]::GetFolderPath('Desktop')`, appName)
	}
	if o.StartMenu {
		mk(`(Join-Path ([Environment]::GetFolderPath('Programs')) '`+psq(appName)+`')`, appName)
		// uninstall shortcut next to the game one
		fmt.Fprintf(&b, `$d=(Join-Path ([Environment]::GetFolderPath('Programs')) '%s');$s=$w.CreateShortcut((Join-Path $d 'إزالة %s.lnk'));$s.TargetPath='%s';$s.WorkingDirectory='%s';$s.IconLocation='%s,0';$s.Save();`,
			psq(appName), psq(appName), psq(filepath.Join(o.Dir, unExe)), psq(o.Dir), psq(exe))
	}
	runPS(b.String())
}

func registerUninstall(dir string, size int64) {
	set := func(name, typ, val string) {
		c := exec.Command("reg", "add", regKey, "/v", name, "/t", typ, "/d", val, "/f")
		hide(c)
		c.Run()
	}
	set("DisplayName", "REG_SZ", appName)
	set("DisplayVersion", "REG_SZ", version)
	set("Publisher", "REG_SZ", "Mad City 3D")
	set("InstallLocation", "REG_SZ", dir)
	set("DisplayIcon", "REG_SZ", filepath.Join(dir, gameExe))
	set("UninstallString", "REG_SZ", `"`+filepath.Join(dir, unExe)+`" --uninstall`)
	set("EstimatedSize", "REG_DWORD", fmt.Sprint(size/1024))
	set("NoModify", "REG_DWORD", "1")
	set("NoRepair", "REG_DWORD", "1")
}

func runPS(script string) string {
	c := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", "[Console]::OutputEncoding=[Text.Encoding]::UTF8;"+script)
	hide(c)
	out, _ := c.Output()
	return strings.TrimSpace(string(out))
}

func stopGame() {
	if runtime.GOOS == "windows" {
		c := exec.Command("taskkill", "/F", "/IM", gameExe)
		hide(c)
		c.Run()
	}
}

func doUninstall(deleteSaves bool) {
	dir := filepath.Dir(mustExe())
	st.set(10, "إغلاق اللعبة إن كانت تعمل...")
	stopGame()
	if runtime.GOOS == "windows" {
		st.set(30, "حذف الاختصارات...")
		runPS(`$d=[Environment]::GetFolderPath('Desktop');Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $d '` + psq(appName) + `.lnk');$p=Join-Path ([Environment]::GetFolderPath('Programs')) '` + psq(appName) + `';Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $p`)
		st.set(55, "إزالة تسجيل البرنامج...")
		c := exec.Command("reg", "delete", regKey, "/f")
		hide(c)
		c.Run()
	}
	if deleteSaves {
		st.set(70, "حذف التقدّم المحفوظ...")
		if cfg, err := os.UserConfigDir(); err == nil {
			os.RemoveAll(filepath.Join(cfg, "MadCity3D"))
		}
	}
	st.set(85, "حذف ملفات اللعبة...")
	os.Remove(filepath.Join(dir, gameExe))
	// this process is uninstall.exe itself: remove the folder right after we exit
	if runtime.GOOS == "windows" {
		c := exec.Command("cmd", "/C", `ping 127.0.0.1 -n 3 >nul & rmdir /s /q "`+dir+`"`)
		hide(c)
		c.Start()
	}
	st.mu.Lock()
	st.Pct, st.Done, st.Active, st.Msg = 100, true, false, "تمت الإزالة"
	st.Log = append(st.Log, "تمت إزالة Mad City 3D ✔")
	st.mu.Unlock()
}

func mustExe() string {
	p, err := os.Executable()
	if err != nil {
		return "."
	}
	return p
}

func browserCandidates() []string {
	if runtime.GOOS != "windows" {
		return []string{"google-chrome", "chromium", "chromium-browser", "microsoft-edge"}
	}
	var out []string
	for _, base := range []string{os.Getenv("ProgramFiles(x86)"), os.Getenv("ProgramFiles"), os.Getenv("LOCALAPPDATA")} {
		if base == "" {
			continue
		}
		out = append(out, filepath.Join(base, "Microsoft", "Edge", "Application", "msedge.exe"), filepath.Join(base, "Google", "Chrome", "Application", "chrome.exe"), filepath.Join(base, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"))
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
	args := strings.Join(os.Args[1:], " ")
	uninstall := strings.Contains(args, "--uninstall") || strings.EqualFold(filepath.Base(mustExe()), unExe)
	if strings.Contains(args, "/S") || strings.Contains(args, "--silent") {
		if uninstall {
			doUninstall(false)
		} else {
			doInstall(installOpts{Dir: defaultDir(), Desktop: true, StartMenu: true})
		}
		return
	}
	mux := http.NewServeMux()
	quit := make(chan struct{}, 1)
	mux.HandleFunc("/api/info", func(w http.ResponseWriter, r *http.Request) {
		_, installed := os.Stat(filepath.Join(defaultDir(), gameExe))
		cur := ""
		if uninstall {
			cur = filepath.Dir(mustExe())
		}
		json.NewEncoder(w).Encode(map[string]any{"mode": map[bool]string{true: "uninstall", false: "install"}[uninstall], "dir": defaultDir(), "version": version, "size": payloadSize(), "installed": installed == nil, "current": cur, "os": runtime.GOOS})
	})
	mux.HandleFunc("/api/browse", func(w http.ResponseWriter, r *http.Request) {
		p := ""
		if runtime.GOOS == "windows" {
			p = runPS(`Add-Type -AssemblyName System.Windows.Forms;$f=New-Object System.Windows.Forms.FolderBrowserDialog;$f.Description='اختر مجلد التثبيت';if($f.ShowDialog() -eq 'OK'){$f.SelectedPath}`)
		}
		json.NewEncoder(w).Encode(map[string]string{"path": p})
	})
	mux.HandleFunc("/api/install", func(w http.ResponseWriter, r *http.Request) {
		var o installOpts
		json.NewDecoder(r.Body).Decode(&o)
		if o.Dir == "" {
			o.Dir = defaultDir()
		}
		if strings.EqualFold(filepath.Base(o.Dir), "MadCity3D") == false && !strings.Contains(strings.ToLower(o.Dir), "madcity") {
			o.Dir = filepath.Join(o.Dir, appFolder)
		}
		st.mu.Lock()
		if st.Active {
			st.mu.Unlock()
			return
		}
		st.resetLocked()
		st.mu.Unlock()
		go doInstall(o)
		json.NewEncoder(w).Encode(map[string]string{"dir": o.Dir})
	})
	mux.HandleFunc("/api/uninstall", func(w http.ResponseWriter, r *http.Request) {
		var o struct {
			Saves bool `json:"saves"`
		}
		json.NewDecoder(r.Body).Decode(&o)
		st.mu.Lock()
		st.resetLocked()
		st.mu.Unlock()
		go doUninstall(o.Saves)
	})
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) { json.NewEncoder(w).Encode(st.snapshot()) })
	mux.HandleFunc("/api/launch", func(w http.ResponseWriter, r *http.Request) {
		var o installOpts
		json.NewDecoder(r.Body).Decode(&o)
		if o.Dir == "" {
			o.Dir = defaultDir()
		}
		c := exec.Command(filepath.Join(o.Dir, gameExe))
		c.Dir = o.Dir
		c.Start()
	})
	mux.HandleFunc("/api/exit", func(w http.ResponseWriter, r *http.Request) {
		select {
		case quit <- struct{}{}:
		default:
		}
	})
	sub := http.FileServer(http.FS(uiFS))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/", "/index.html":
			b, _ := uiFS.ReadFile("ui/index.html")
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(b)
		case "/icon.png":
			b, _ := uiFS.ReadFile("ui/icon.png")
			w.Header().Set("Content-Type", "image/png")
			w.Write(b)
		default:
			sub.ServeHTTP(w, r)
		}
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		os.Exit(1)
	}
	url := fmt.Sprintf("http://%s/", ln.Addr().String())
	go http.Serve(ln, mux)
	if os.Getenv("MADCITY_NOBROWSER") != "" {
		fmt.Println("setup UI on", url)
		<-quit
		return
	}
	if b := findBrowser(); b != "" {
		profile := filepath.Join(os.TempDir(), "MadCitySetup-profile")
		cmd := exec.Command(b, "--app="+url, "--user-data-dir="+profile, "--window-size=900,600", "--no-first-run", "--no-default-browser-check", "--disable-features=Translate")
		if err := cmd.Start(); err == nil {
			go func() { <-quit; cmd.Process.Kill() }()
			cmd.Wait()
			return
		}
	}
	// fallback: default browser, quit when told or after a long idle period
	switch runtime.GOOS {
	case "windows":
		exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		exec.Command("open", url).Start()
	default:
		exec.Command("xdg-open", url).Start()
	}
	select {
	case <-quit:
	case <-time.After(30 * time.Minute):
	}
}
