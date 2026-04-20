import { useState, useEffect } from "react";

function uid() { return Math.random().toString(36).slice(2) + Date.now(); }
function fmt(date) {
return new Date(date + “T12:00:00”).toLocaleDateString(“en-US”, { month: “short”, day: “numeric”, year: “numeric” });
}
function today() { return new Date().toISOString().slice(0, 10); }

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_PLAYERS = “cribbage_s26_players”;
const LS_GAMES   = “cribbage_s26_games”;

function lsGet(key, fallback) {
try {
const v = localStorage.getItem(key);
return v ? JSON.parse(v) : fallback;
} catch { return fallback; }
}
function lsSet(key, val) {
try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Svg = ({ children, size = 18 }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const TrophyIcon = () => <Svg><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Svg>;
const HistoryIcon = () => <Svg><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></Svg>;
const UserIcon = () => <Svg><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
const PlusIcon = () => <Svg strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const ChevronDown = () => <Svg size={16}><polyline points="6 9 12 15 18 9"/></Svg>;
const UsersIcon = () => <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
const PersonIcon = () => <Svg><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></Svg>;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url(‘https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap’);
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:‘Lora’,Georgia,serif;background:#0f1e0f;min-height:100vh;color:#f0e8d0}
:root{
–felt:#1e3a1e;–felt-dk:#142914;–felt-lt:#254825;
–gold:#c9a84c;–gold-lt:#e8c96a;–gold-dim:rgba(201,168,76,0.18);
–cream:#f0e8d0;–cream-dim:#9a9278;
–red:#c0392b;–green:#5aaa58;
–card:#1c3320;–border:rgba(201,168,76,0.25);
–sh:0 4px 20px rgba(0,0,0,0.5)
}
.app{max-width:480px;margin:0 auto;min-height:100vh;background:var(–felt);position:relative;padding-bottom:90px}
.app::before{content:’’;position:fixed;inset:0;max-width:480px;margin:0 auto;
background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.02) 3px,rgba(0,0,0,.02) 4px),
repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(0,0,0,.02) 3px,rgba(0,0,0,.02) 4px);
pointer-events:none;z-index:0}
.z1{position:relative;z-index:1}

/* Header */
.hdr{background:var(–felt-dk);border-bottom:2px solid var(–gold);padding:18px 20px 14px;text-align:center}
.hdr-sub{font-style:italic;color:var(–gold);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:3px}
.hdr-title{font-family:‘Playfair Display’,serif;font-size:26px;font-weight:900;color:var(–cream);line-height:1.1}
.hdr-title em{color:var(–gold);font-style:normal}

/* Nav */
.nav{display:flex;background:var(–felt-dk);border-bottom:1px solid var(–border)}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 7px;
border:none;background:none;color:var(–cream-dim);cursor:pointer;font-family:‘Lora’,serif;
font-size:10px;letter-spacing:.5px;text-transform:uppercase;transition:color .15s;
border-top:2px solid transparent}
.nav-btn.on{color:var(–gold);border-top-color:var(–gold)}

/* Section */
.sec{padding:16px}
.sec-title{font-family:‘Playfair Display’,serif;font-size:18px;color:var(–gold);
margin-bottom:14px;display:flex;align-items:center;gap:8px}
.sec-title::after{content:’’;flex:1;height:1px;background:var(–border)}

/* Sub-tabs (for leaderboard views) */
.subtabs{display:flex;background:rgba(0,0,0,.25);border:1px solid var(–border);
border-radius:8px;padding:3px;margin-bottom:16px;gap:3px}
.subtab{flex:1;padding:7px 4px;border:none;background:transparent;color:var(–cream-dim);
font-family:‘Lora’,serif;font-size:12px;border-radius:6px;cursor:pointer;transition:all .15s;
font-weight:600;letter-spacing:.3px}
.subtab.on{background:var(–gold);color:var(–felt-dk)}

/* Card */
.card{background:var(–card);border:1px solid var(–border);border-radius:8px;padding:14px;
margin-bottom:10px;box-shadow:var(–sh)}

/* Leaderboard rows */
.lb{display:flex;align-items:center;padding:11px 14px;background:var(–card);
border:1px solid var(–border);border-radius:8px;margin-bottom:8px;gap:12px}
.lb-rank{font-family:‘Playfair Display’,serif;font-size:19px;font-weight:900;
color:rgba(201,168,76,.3);width:24px;text-align:center;flex-shrink:0}
.lb-rank.top{color:var(–gold)}
.lb-name{flex:1;font-size:15px;font-weight:600;color:var(–cream);min-width:0;
white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-stats{display:flex;gap:12px;flex-shrink:0}
.lb-stat{text-align:center;min-width:28px}
.lb-sv{font-family:‘Playfair Display’,serif;font-size:15px;font-weight:700;color:var(–cream)}
.lb-sv.pos{color:var(–green)}.lb-sv.neg{color:var(–red)}
.lb-sl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(–cream-dim);margin-top:1px}

/* Game type badge */
.type-badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;text-transform:uppercase;
letter-spacing:1px;padding:2px 7px;border-radius:3px;font-family:‘Lora’,serif;font-weight:600}
.type-solo{background:rgba(90,170,88,.15);color:var(–green);border:1px solid rgba(90,170,88,.3)}
.type-team{background:var(–gold-dim);color:var(–gold);border:1px solid rgba(201,168,76,.3)}

/* Game history */
.g-hdr{display:flex;align-items:center;justify-content:space-between;gap:8px}
.g-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.g-date{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(–gold);font-style:italic}
.g-entries{margin-top:10px;display:flex;flex-direction:column;gap:3px}
.g-entry{display:flex;justify-content:space-between;align-items:center;padding:5px 0}
.g-entry-name{font-size:14px;color:var(–cream)}
.g-entry-score{font-family:‘Playfair Display’,serif;font-size:17px;font-weight:700;color:var(–cream-dim)}
.g-entry-score.win{color:var(–gold)}
.win-badge{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(–felt-dk);
background:var(–gold);padding:2px 6px;border-radius:3px;margin-left:6px;vertical-align:middle}
.g-div{height:1px;background:var(–border);margin:3px 0}
.g-notes{font-size:13px;font-style:italic;color:var(–cream-dim);margin-top:8px;
line-height:1.5;border-top:1px solid var(–border);padding-top:8px}

/* Filter chips */
.chips{display:flex;gap:7px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;
scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;padding:5px 13px;border-radius:20px;border:1px solid var(–border);
background:transparent;color:var(–cream-dim);font-family:‘Lora’,serif;font-size:12px;
cursor:pointer;transition:all .15s;white-space:nowrap}
.chip.on{background:var(–gold);color:var(–felt-dk);border-color:var(–gold);font-weight:600}

/* Roster */
.roster-item{display:flex;align-items:center;gap:10px}
.avatar{width:36px;height:36px;border-radius:50%;background:var(–gold-dim);
display:flex;align-items:center;justify-content:center;color:var(–gold);
font-family:‘Playfair Display’,serif;font-weight:700;font-size:16px;flex-shrink:0}

/* FAB */
.fab{position:fixed;bottom:24px;right:calc(50% - 220px);width:56px;height:56px;
border-radius:50%;background:var(–gold);color:var(–felt-dk);border:none;cursor:pointer;
display:flex;align-items:center;justify-content:center;z-index:100;
box-shadow:0 4px 20px rgba(0,0,0,.6),0 0 0 3px rgba(201,168,76,.18);transition:all .2s}
.fab:hover{background:var(–gold-lt);transform:scale(1.06)}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;
display:flex;align-items:flex-end;justify-content:center}
.modal{background:var(–felt-dk);border:1px solid var(–border);
border-top-left-radius:16px;border-top-right-radius:16px;
width:100%;max-width:480px;padding:20px;max-height:92vh;overflow-y:auto;
animation:su .22s ease-out}
@keyframes su{from{transform:translateY(36px);opacity:0}to{transform:none;opacity:1}}
.handle{width:36px;height:4px;background:var(–border);border-radius:2px;margin:0 auto 16px}
.modal-title{font-family:‘Playfair Display’,serif;font-size:20px;color:var(–cream);
margin-bottom:16px;text-align:center}

/* Mode toggle (Solo / Teams) */
.mode-toggle{display:flex;background:rgba(0,0,0,.3);border:1px solid var(–border);
border-radius:10px;padding:4px;margin-bottom:16px;gap:4px}
.mode-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
padding:10px 8px;border:none;background:transparent;color:var(–cream-dim);
font-family:‘Lora’,serif;font-size:14px;font-weight:600;border-radius:7px;cursor:pointer;
transition:all .18s}
.mode-btn.on{background:var(–gold);color:var(–felt-dk)}
.mode-btn svg{opacity:.7}
.mode-btn.on svg{opacity:1}

/* Form */
label{display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;
color:var(–gold);margin-bottom:5px;font-family:‘Lora’,serif}
input[type=text],input[type=number],input[type=date],textarea,select{
width:100%;background:rgba(0,0,0,.3);border:1px solid var(–border);border-radius:6px;
color:var(–cream);font-family:‘Lora’,serif;font-size:15px;padding:10px 12px;
outline:none;margin-bottom:14px;transition:border-color .2s;-webkit-appearance:none}
input:focus,textarea:focus,select:focus{border-color:var(–gold)}
input::placeholder,textarea::placeholder{color:rgba(240,232,208,.28)}
select option{background:var(–felt-dk)}
textarea{resize:vertical;min-height:68px}
.row{display:flex;gap:10px}.row>*{flex:1}

/* Solo player row: name + score side by side */
.solo-row{display:grid;grid-template-columns:1fr 90px;gap:10px;align-items:end;margin-bottom:10px}
.solo-row input{margin-bottom:0}
.solo-row label{margin-bottom:5px}

.fgroup{background:rgba(0,0,0,.2);border:1px solid var(–border);border-radius:8px;
padding:12px;margin-bottom:12px}
.fgroup-title{font-size:11px;text-transform:uppercase;letter-spacing:1px;
color:var(–gold);margin-bottom:10px;font-family:‘Lora’,serif;display:flex;
align-items:center;gap:6px}

/* Add more / remove player buttons */
.link-btn{background:none;border:none;color:var(–gold);font-family:‘Lora’,serif;
font-size:13px;cursor:pointer;padding:0;text-decoration:underline;margin-bottom:12px;
display:inline-block}
.link-btn:hover{color:var(–gold-lt)}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;
border-radius:6px;border:none;cursor:pointer;font-family:‘Lora’,serif;font-size:14px;
font-weight:600;transition:all .15s;width:100%}
.btn-gold{background:var(–gold);color:var(–felt-dk)}
.btn-gold:hover{background:var(–gold-lt)}
.btn-outline{background:transparent;border:1px solid var(–border);color:var(–cream)}
.btn-outline:hover{border-color:var(–gold);color:var(–gold)}
.actions{display:flex;gap:10px;margin-top:4px}

/* Choice buttons */
.choice{display:flex;flex-direction:column;gap:10px}
.choice-btn{display:flex;align-items:center;gap:14px;padding:16px;background:var(–card);
border:1px solid var(–border);border-radius:10px;cursor:pointer;text-align:left;
transition:border-color .2s;width:100%}
.choice-btn:hover{border-color:var(–gold)}
.choice-ico{width:40px;height:40px;border-radius:50%;background:var(–gold-dim);
display:flex;align-items:center;justify-content:center;color:var(–gold);flex-shrink:0}
.choice-txt strong{display:block;font-size:16px;color:var(–cream);margin-bottom:2px;font-family:‘Lora’,serif}
.choice-txt span{font-size:12px;font-style:italic;color:var(–cream-dim)}

.empty{text-align:center;padding:40px 20px;color:var(–cream-dim);font-style:italic;font-size:14px;line-height:1.6}
.info{font-size:12px;font-style:italic;color:var(–cream-dim);margin-bottom:14px;line-height:1.5;
padding:8px 10px;background:rgba(0,0,0,.15);border-radius:6px;border-left:2px solid var(–border)}
.divider{height:1px;background:var(–border);margin:14px 0}
`;

// ─── Leaderboard computation ──────────────────────────────────────────────────
// mode: “solo” | “team” | “all”
function computeLB(players, games, mode) {
const s = {};
players.forEach(p => { s[p.name] = { name: p.name, wins: 0, losses: 0, net: 0, gp: 0 }; });

const relevant = games.filter(g => mode === “all” || g.mode === mode);

relevant.forEach(game => {
const maxScore = Math.max(…game.entries.map(e => e.score));
game.entries.forEach(entry => {
const isWin = entry.score === maxScore;
const opponents = game.entries.filter(e => e !== entry);
const oppTotal = opponents.reduce((sum, e) => sum + e.score, 0);
entry.players.forEach(name => {
if (!s[name]) s[name] = { name, wins: 0, losses: 0, net: 0, gp: 0 };
s[name].gp++;
if (isWin) s[name].wins++; else s[name].losses++;
s[name].net += entry.score - oppTotal;
});
});
});

return Object.values(s)
.filter(p => p.gp > 0 || players.find(pl => pl.name === p.name))
.sort((a, b) => b.wins - a.wins || b.net - a.net);
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
const [players, setPlayers] = useState(() => lsGet(LS_PLAYERS, []));
// game: { id, date, mode: “solo”|“team”, notes, entries: [{players:[str], score:num}] }
const [games, setGames]     = useState(() => lsGet(LS_GAMES, []));

// Persist to localStorage whenever data changes
useEffect(() => { lsSet(LS_PLAYERS, players); }, [players]);
useEffect(() => { lsSet(LS_GAMES, games); }, [games]);

const [tab, setTab]         = useState(“lb”);
const [lbView, setLbView]   = useState(“all”); // “all”|“solo”|“team”
const [modal, setModal]     = useState(null);
const [histFilter, setHistFilter] = useState(“All”);
const [histMode, setHistMode]     = useState(“all”);
const [expanded, setExpanded]     = useState(null);

// ── Add-player form ──
const [newName, setNewName] = useState(””);

// ── Add-result form ──
const [gameMode, setGameMode]   = useState(“solo”); // “solo”|“team”
const [gameDate, setGameDate]   = useState(today());
const [gameNotes, setGameNotes] = useState(””);

// Solo: list of {player, score}
const [soloEntries, setSoloEntries] = useState([
{ player: “”, score: “” },
{ player: “”, score: “” },
]);

// Teams: always exactly 2 teams of 2 players each
const [teamEntries, setTeamEntries] = useState([
{ players: [””, “”], score: “” },
{ players: [””, “”], score: “” },
]);

const playerNames = players.map(p => p.name);

// ── Add player ──
function addPlayer() {
const name = newName.trim();
if (!name) return;
if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
alert(“That name already exists.”); return;
}
setPlayers(prev => […prev, { id: uid(), name }]);
setNewName(””);
setModal(null);
}

// ── Add result ──
function addResult() {
let entries;
if (gameMode === “solo”) {
entries = soloEntries
.filter(e => e.player)
.map(e => ({ players: [e.player], score: parseInt(e.score) || 0 }));
if (entries.length < 2) { alert(“Enter at least 2 players.”); return; }
} else {
entries = teamEntries.map(t => ({
players: t.players.filter(Boolean),
score: parseInt(t.score) || 0,
}));
for (const t of entries) {
if (t.players.length === 0) { alert(“Each team needs at least one player.”); return; }
}
}

```
const game = { id: uid(), date: gameDate, mode: gameMode, notes: gameNotes.trim(), entries };
setGames(prev => [game, ...prev].sort((a, b) => b.date.localeCompare(a.date)));

// reset
setSoloEntries([{ player: "", score: "" }, { player: "", score: "" }]);
setTeamEntries([{ players: ["", ""], score: "" }, { players: ["", ""], score: "" }]);
setGameDate(today());
setGameNotes("");
setModal(null);
```

}

// ── Solo entry helpers ──
function setSoloPlayer(i, val) {
setSoloEntries(prev => prev.map((e, j) => j === i ? { …e, player: val } : e));
}
function setSoloScore(i, val) {
setSoloEntries(prev => prev.map((e, j) => j === i ? { …e, score: val } : e));
}
function addSoloEntry() {
setSoloEntries(prev => […prev, { player: “”, score: “” }]);
}
function removeSoloEntry(i) {
setSoloEntries(prev => prev.filter((_, j) => j !== i));
}

// ── Team entry helpers ──
function setTeamPlayer(ti, pi, val) {
setTeamEntries(prev => prev.map((t, i) =>
i !== ti ? t : { …t, players: t.players.map((p, j) => j === pi ? val : p) }
));
}
function setTeamScore(ti, val) {
setTeamEntries(prev => prev.map((t, i) => i !== ti ? t : { …t, score: val }));
}

// ── Leaderboard data ──
const lb = computeLB(players, games, lbView);

// ── History filter ──
const filterOpts = [“All”, …playerNames];
let visGames = games;
if (histMode !== “all”) visGames = visGames.filter(g => g.mode === histMode);
if (histFilter !== “All”) visGames = visGames.filter(g =>
g.entries.some(e => e.players.includes(histFilter))
);

// ── Leaderboard label ──
const lbLabel = lbView === “all” ? “All Games” : lbView === “solo” ? “Solo Games” : “Team Games”;

return (
<>
<style>{CSS}</style>
<div className="app">
<div className="z1">

```
      {/* Header */}
      <div className="hdr">
        <div className="hdr-sub">☀ Summer 2026 ☀</div>
        <div className="hdr-title">Cribbage <em>Leaderboard</em></div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <button className={`nav-btn ${tab === "lb" ? "on" : ""}`} onClick={() => setTab("lb")}>
          <TrophyIcon /><span>Standings</span>
        </button>
        <button className={`nav-btn ${tab === "history" ? "on" : ""}`} onClick={() => setTab("history")}>
          <HistoryIcon /><span>History</span>
        </button>
        <button className={`nav-btn ${tab === "roster" ? "on" : ""}`} onClick={() => setTab("roster")}>
          <UserIcon /><span>Players</span>
        </button>
      </nav>

      {/* ── Standings ── */}
      {tab === "lb" && (
        <div className="sec">
          <div className="subtabs">
            <button className={`subtab ${lbView === "all" ? "on" : ""}`} onClick={() => setLbView("all")}>All Games</button>
            <button className={`subtab ${lbView === "solo" ? "on" : ""}`} onClick={() => setLbView("solo")}>Solo</button>
            <button className={`subtab ${lbView === "team" ? "on" : ""}`} onClick={() => setLbView("team")}>Teams</button>
          </div>
          <div className="sec-title"><TrophyIcon />{lbLabel}</div>
          {lb.length === 0 && (
            <div className="empty">No results yet for this category.<br/>Add players and record games to see standings.</div>
          )}
          {lb.map((p, i) => (
            <div className="lb" key={p.name}>
              <div className={`lb-rank ${i < 3 && p.gp > 0 ? "top" : ""}`}>{i + 1}</div>
              <div className="lb-name">{p.name}</div>
              <div className="lb-stats">
                <div className="lb-stat">
                  <div className="lb-sv">{p.wins}</div>
                  <div className="lb-sl">W</div>
                </div>
                <div className="lb-stat">
                  <div className="lb-sv">{p.losses}</div>
                  <div className="lb-sl">L</div>
                </div>
                <div className="lb-stat">
                  <div className={`lb-sv ${p.net > 0 ? "pos" : p.net < 0 ? "neg" : ""}`}>
                    {p.net > 0 ? "+" : ""}{p.net}
                  </div>
                  <div className="lb-sl">+/−</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="sec">
          <div className="sec-title"><HistoryIcon />Game History</div>

          {/* Mode filter */}
          <div className="subtabs" style={{ marginBottom: 10 }}>
            <button className={`subtab ${histMode === "all" ? "on" : ""}`} onClick={() => setHistMode("all")}>All</button>
            <button className={`subtab ${histMode === "solo" ? "on" : ""}`} onClick={() => setHistMode("solo")}>Solo</button>
            <button className={`subtab ${histMode === "team" ? "on" : ""}`} onClick={() => setHistMode("team")}>Teams</button>
          </div>

          {/* Player filter */}
          <div className="chips">
            {filterOpts.map(f => (
              <button key={f} className={`chip ${histFilter === f ? "on" : ""}`}
                onClick={() => setHistFilter(f)}>{f}</button>
            ))}
          </div>

          {visGames.length === 0 && <div className="empty">No games match this filter.</div>}

          {visGames.map(game => {
            const max = Math.max(...game.entries.map(e => e.score));
            const open = expanded === game.id;
            return (
              <div className="card" key={game.id}
                style={{ cursor: "pointer" }}
                onClick={() => setExpanded(open ? null : game.id)}>
                <div className="g-hdr">
                  <div className="g-meta">
                    <div className="g-date">{fmt(game.date)}</div>
                    <span className={`type-badge ${game.mode === "solo" ? "type-solo" : "type-team"}`}>
                      {game.mode === "solo" ? "Solo" : "Teams"}
                    </span>
                  </div>
                  <ChevronDown />
                </div>

                <div className="g-entries">
                  {game.entries.map((entry, ei) => {
                    const win = entry.score === max;
                    // For team games, group visually
                    return (
                      <div key={ei}>
                        {game.mode === "team" && ei > 0 && <div className="g-div" />}
                        <div className="g-entry">
                          <div className="g-entry-name">
                            {entry.players.join(" & ")}
                            {win && <span className="win-badge">Won</span>}
                          </div>
                          <div className={`g-entry-score ${win ? "win" : ""}`}>
                            {entry.score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {open && game.notes && (
                  <div className="g-notes">📝 {game.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Roster ── */}
      {tab === "roster" && (
        <div className="sec">
          <div className="sec-title"><UserIcon />Roster</div>
          {players.length === 0 && (
            <div className="empty">No players yet.<br/>Tap + to add players to the roster.</div>
          )}
          {players.map(p => (
            <div className="card roster-item" key={p.id}>
              <div className="avatar">{p.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 16, color: "var(--cream)", flex: 1 }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* FAB */}
    <button className="fab" onClick={() => setModal("add")}><PlusIcon /></button>

    {/* ── Modal: Choose ── */}
    {modal === "add" && (
      <div className="overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="handle" />
          <div className="modal-title">What would you like to add?</div>
          <div className="choice">
            <button className="choice-btn" onClick={() => setModal("result")}>
              <div className="choice-ico"><TrophyIcon /></div>
              <div className="choice-txt">
                <strong>Game Result</strong>
                <span>Record the outcome of a game just played</span>
              </div>
            </button>
            <button className="choice-btn" onClick={() => setModal("player")}>
              <div className="choice-ico"><UserIcon /></div>
              <div className="choice-txt">
                <strong>New Player</strong>
                <span>Add someone to the roster</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: Add Player ── */}
    {modal === "player" && (
      <div className="overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="handle" />
          <div className="modal-title">Add Player</div>
          <label>Player Name</label>
          <input type="text" placeholder="e.g. Margaret" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPlayer()} autoFocus />
          <div className="actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={addPlayer}>Add Player</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: Add Result ── */}
    {modal === "result" && (
      <div className="overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="handle" />
          <div className="modal-title">Record Game Result</div>

          {/* Solo / Teams toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${gameMode === "solo" ? "on" : ""}`}
              onClick={() => setGameMode("solo")}
            >
              <PersonIcon />Solo
            </button>
            <button
              className={`mode-btn ${gameMode === "team" ? "on" : ""}`}
              onClick={() => setGameMode("team")}
            >
              <UsersIcon />Teams
            </button>
          </div>

          {/* Date */}
          <label>Date Played</label>
          <input type="date" value={gameDate} onChange={e => setGameDate(e.target.value)} />

          <div className="info">
            {gameMode === "solo"
              ? "Each player competed individually. Enter each player's final score."
              : "Two teams of two players. Each team shares a score. The team reaching 121 wins."}
          </div>

          {/* ── Solo form ── */}
          {gameMode === "solo" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "0 10px", marginBottom: 4 }}>
                <label>Player</label>
                <label>Score</label>
              </div>
              {soloEntries.map((entry, i) => (
                <div className="solo-row" key={i}>
                  <div>
                    {playerNames.length > 0 ? (
                      <select value={entry.player} onChange={e => setSoloPlayer(i, e.target.value)}>
                        <option value="">— Select —</option>
                        {playerNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder={`Player ${i + 1}`}
                        value={entry.player} onChange={e => setSoloPlayer(i, e.target.value)} />
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="number" min="0" placeholder="0"
                      value={entry.score} onChange={e => setSoloScore(i, e.target.value)} />
                    {soloEntries.length > 2 && (
                      <button onClick={() => removeSoloEntry(i)}
                        style={{ background: "none", border: "none", color: "var(--cream-dim)", cursor: "pointer", fontSize: 18, lineHeight: 1, paddingBottom: 14, flexShrink: 0 }}>×</button>
                    )}
                  </div>
                </div>
              ))}
              {soloEntries.length < 6 && (
                <button className="link-btn" onClick={addSoloEntry}>+ Add another player</button>
              )}
            </>
          )}

          {/* ── Team form ── */}
          {gameMode === "team" && (
            <>
              {teamEntries.map((team, ti) => (
                <div className="fgroup" key={ti}>
                  <div className="fgroup-title">
                    <UsersIcon />Team {ti + 1}
                  </div>
                  {[0, 1].map(pi => (
                    <div key={pi}>
                      <label>Player {pi + 1}</label>
                      {playerNames.length > 0 ? (
                        <select value={team.players[pi]} onChange={e => setTeamPlayer(ti, pi, e.target.value)}>
                          <option value="">— Select player —</option>
                          {playerNames.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder={`Player ${pi + 1}`}
                          value={team.players[pi]} onChange={e => setTeamPlayer(ti, pi, e.target.value)} />
                      )}
                    </div>
                  ))}
                  <label>Team Score</label>
                  <input type="number" min="0" placeholder="e.g. 121"
                    value={team.score} onChange={e => setTeamScore(ti, e.target.value)}
                    style={{ marginBottom: 0 }} />
                </div>
              ))}
            </>
          )}

          <div className="divider" />

          {/* Notes */}
          <label>Notes (optional)</label>
          <textarea placeholder="Anything noteworthy about this game?"
            value={gameNotes} onChange={e => setGameNotes(e.target.value)} />

          <div className="actions">
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={addResult}>Save Result</button>
          </div>
        </div>
      </div>
    )}

  </div>
</>
```

);
}
