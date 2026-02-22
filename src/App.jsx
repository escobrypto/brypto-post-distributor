import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════
// BRYPTO CALL ENGINE v4 — Phase 1 (Clean Build)
// ══════════════════════════════════════════════════════════════



const COLORS = {
  bg: "#060709",
  panel: "#0d0f16",
  card: "#11131e",
  border: "#1a1d2d",
  bd2: "#22263a",
  text: "#e3e6f0",
  sub: "#9ea3bc",
  muted: "#6c7190",
  dim: "#3e4361",
  long: "#00dfa3",
  longBg: "rgba(0,223,163,.07)",
  longBdr: "rgba(0,223,163,.18)",
  short: "#ff3868",
  shortBg: "rgba(255,56,104,.07)",
  shortBdr: "rgba(255,56,104,.18)",
  brand: "#1cb8e0",
  brandBg: "rgba(28,184,224,.08)",
  brandBdr: "rgba(28,184,224,.2)",
  gold: "#f0b030",
  goldBg: "rgba(240,176,48,.08)",
  blue: "#5865f2",
  info: "#3b82f6",
  infoBg: "rgba(59,130,246,.08)",
};

const FONT = "'DM Sans', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

function BryptoLogo({ size }) {
  const s = size || 28;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" style={{ borderRadius: s > 20 ? "50%" : 4, display: "block" }}>
      <rect width="40" height="40" fill="#000"/>
      <defs>
        <linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff"/>
          <stop offset="50%" stopColor="#1cb8e0"/>
          <stop offset="100%" stopColor="#0088cc"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <text x="20" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="28" fontWeight="900" fill="url(#iceGrad)" filter="url(#glow)" style={{ letterSpacing: "-1px" }}>B</text>
    </svg>
  );
}


// ── Helpers ──
function formatPrice(p) {
  const n = parseFloat(p);
  if (isNaN(n)) return "—";
  if (n >= 10000) return n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  return n >= 0.001 ? n.toFixed(6) : n.toFixed(8);
}

function pctDiff(a, b) {
  const x = parseFloat(a), y = parseFloat(b);
  if (!x || !y) return null;
  return (Math.abs(y - x) / x * 100).toFixed(1);
}

function calcRR(entry, sl, tp) {
  const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
  if (!e || !s || !t) return null;
  const risk = Math.abs(e - s);
  return risk === 0 ? null : (Math.abs(t - e) / risk).toFixed(1);
}

function getRTarget(entry, sl, mult, dir) {
  const e = parseFloat(entry), s = parseFloat(sl);
  if (!e || !s) return "";
  const risk = Math.abs(e - s);
  return dir === "LONG" ? (e + risk * mult).toString() : (e - risk * mult).toString();
}

function weightedAvgEntry(entryPrice, entryPct, dcas) {
  // Build full list: main entry + all DCA levels
  const allEntries = [];
  const ep = parseFloat(entryPrice), epc = parseFloat(entryPct);
  if (ep && epc) allEntries.push({ price: ep, pct: epc });
  dcas.forEach(d => {
    const p = parseFloat(d.price), pc = parseFloat(d.pct);
    if (p && pc) allEntries.push({ price: p, pct: pc });
  });
  if (allEntries.length < 1) return null;
  const totalPct = allEntries.reduce((s, e) => s + e.pct, 0);
  if (totalPct === 0) return null;
  return allEntries.reduce((s, e) => s + (e.price * e.pct / totalPct), 0);
}

// Helper: check if allocations sum to ~100
function allocationTotal(entryPct, dcas) {
  let total = parseFloat(entryPct) || 0;
  dcas.forEach(d => { total += parseFloat(d.pct) || 0; });
  return total;
}

// Weighted realized R accounting for partial trims
function weightedRealizedR(entry, sl, targets) {
  const e = parseFloat(entry), s = parseFloat(sl);
  if (!e || !s) return null;
  const risk = Math.abs(e - s);
  if (risk === 0) return null;

  const validTargets = targets.filter(t => t.price && t.trim);
  if (!validTargets.length) return null;

  let totalTrimPct = 0;
  let weightedR = 0;
  validTargets.forEach(t => {
    const trimPct = parseFloat(t.trim) || 0;
    const tgtR = Math.abs(parseFloat(t.price) - e) / risk;
    weightedR += tgtR * (trimPct / 100);
    totalTrimPct += trimPct;
  });

  if (totalTrimPct < 0.5) return null;
  // Scale to actual trim coverage
  return (weightedR).toFixed(2);
}

function makeTradeId() {
  return "BRY-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9999)).padStart(4, "0");
}

// ── Status definitions ──
const STATUSES = {
  pending: { label: "Pending", color: COLORS.gold, bg: COLORS.goldBg, icon: "⏳" },
  active: { label: "Active", color: COLORS.info, bg: COLORS.infoBg, icon: "🔵" },
  partial: { label: "Partial TP", color: COLORS.long, bg: COLORS.longBg, icon: "✅" },
  break_even: { label: "Break Even", color: COLORS.sub, bg: "rgba(160,165,190,.06)", icon: "🔒" },
  closed: { label: "Closed", color: COLORS.long, bg: COLORS.longBg, icon: "💰" },
  invalidated: { label: "Invalid", color: COLORS.short, bg: COLORS.shortBg, icon: "❌" },
  stopped: { label: "Stopped", color: COLORS.short, bg: COLORS.shortBg, icon: "🛑" },
};

// ── Micro Components ──

function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.color}15`,
      display: "inline-flex", alignItems: "center", gap: 3, fontFamily: FONT,
    }}>
      <span style={{ fontSize: 9 }}>{s.icon}</span>{s.label}
    </span>
  );
}

function TextInput({ label, value, onChange, placeholder, type, mono, suffix, small, style: sx, autoFocus, flex }) {
  return (
    <div style={{ flex: flex || 1, minWidth: 0, ...sx }}>
      {label && (
        <div style={{
          fontSize: 9.5, fontWeight: 700, color: COLORS.muted, marginBottom: 4,
          letterSpacing: ".7px", textTransform: "uppercase", fontFamily: FONT,
        }}>{label}</div>
      )}
      <div style={{ position: "relative" }}>
        <input
          autoFocus={autoFocus}
          type={type || "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ""}
          style={{
            width: "100%",
            padding: small ? "6px 9px" : "8px 12px",
            paddingRight: suffix ? 32 : 12,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            color: COLORS.text,
            fontSize: small ? 12 : 13,
            fontFamily: mono ? MONO : FONT,
            outline: "none",
            transition: "border .12s, box-shadow .12s",
          }}
          onFocus={e => {
            e.target.style.borderColor = COLORS.brand;
            e.target.style.boxShadow = `0 0 0 2px ${COLORS.brandBg}`;
          }}
          onBlur={e => {
            e.target.style.borderColor = COLORS.border;
            e.target.style.boxShadow = "none";
          }}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            fontSize: 9.5, color: COLORS.dim, fontFamily: MONO,
          }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

function PillButton({ children, active, color, onClick, small }) {
  const c = color || COLORS.brand;
  const bgMap = {
    [COLORS.long]: COLORS.longBg,
    [COLORS.short]: COLORS.shortBg,
    [COLORS.gold]: COLORS.goldBg,
  };
  return (
    <button onClick={onClick} style={{
      padding: small ? "3px 8px" : "4px 12px",
      borderRadius: 16,
      border: `1px solid ${active ? c + "40" : COLORS.border}`,
      background: active ? (bgMap[c] || COLORS.brandBg) : "transparent",
      color: active ? c : COLORS.muted,
      fontSize: small ? 10 : 11.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: FONT,
      transition: "all .1s",
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function ActionButton({ children, color, outline, small, full, disabled, onClick, style: sx }) {
  const c = color || COLORS.brand;
  const isLight = c === COLORS.long || c === COLORS.gold;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: small ? "6px 12px" : "9px 20px",
        background: disabled ? COLORS.border : outline ? "transparent" : c,
        border: outline ? `1.5px solid ${disabled ? COLORS.border : c}` : "none",
        borderRadius: 7,
        color: disabled ? COLORS.dim : outline ? c : isLight ? "#060709" : "#fff",
        fontSize: small ? 11 : 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all .1s",
        fontFamily: FONT,
        width: full ? "100%" : "auto",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
        whiteSpace: "nowrap",
        ...sx,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
    >{children}</button>
  );
}

function ToggleSwitch({ on, onToggle, label }) {
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
      padding: "4px 0", userSelect: "none",
    }}>
      <div style={{
        width: 30, height: 15, borderRadius: 8,
        background: on ? COLORS.brand : COLORS.border,
        transition: "background .15s", position: "relative", flexShrink: 0,
      }}>
        <div style={{
          width: 11, height: 11, borderRadius: "50%",
          background: on ? "#fff" : COLORS.dim,
          position: "absolute", top: 2, left: on ? 17 : 2, transition: "all .15s",
        }} />
      </div>
      <span style={{ fontSize: 12, color: on ? COLORS.text : COLORS.muted, fontWeight: 500, fontFamily: FONT }}>{label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PREMIUM EMBED
// ══════════════════════════════════════════════════════════════
function PremiumEmbed({ call, fields }) {
  const isLong = call.direction === "LONG";
  const accent = isLong ? COLORS.long : COLORS.short;
  const targets = (call.targets || []).filter(t => t.price);
  const dcaList = (call.dcas || []).filter(d => d.price);
  const wAvg = dcaList.length > 0 ? weightedAvgEntry(call.entry, call.entryPct, dcaList) : null;
  const effectiveEntry = wAvg || parseFloat(call.entry);
  const slPct = effectiveEntry ? pctDiff(effectiveEntry, call.sl) : null;
  const maxRR = targets.length > 0 && effectiveEntry ? calcRR(effectiveEntry, call.sl, targets[targets.length - 1].price) : null;
  const st = STATUSES[call.status] || STATUSES.pending;
  const updates = call.updates || [];

  const discordBg = "#313338";
  const embedBg = "#2b2d31";
  const fieldColor = "#80848e";
  const brightText = "#f2f3f5";
  const dimText = "#5d616b";

  return (
    <div style={{ background: discordBg, borderRadius: 8, padding: "12px 12px 8px", fontFamily: "'gg sans', 'Noto Sans', Helvetica, Arial, sans-serif" }}>
      {/* Bot message header */}
      <div style={{ display: "flex", gap: 9, marginBottom: 6 }}>
        <div style={{ flexShrink: 0 }}><BryptoLogo size={38} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, paddingTop: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: brightText }}>Brypto</span>
          <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: COLORS.blue, color: "#fff", fontWeight: 500, lineHeight: "14px" }}>BOT</span>
          <span style={{ fontSize: 11, color: fieldColor, marginLeft: 2 }}>Today at {new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Embed */}
      <div style={{ marginLeft: 47 }}>
        <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", background: embedBg, border: "1px solid #26282e" }}>
          {/* Accent bar */}
          <div style={{
            width: 4, flexShrink: 0,
            background: call.status === "invalidated" || call.status === "stopped" ? COLORS.short
              : call.status === "closed" || call.status === "partial" ? COLORS.long
              : isLong ? COLORS.long : COLORS.short,
          }} />

          <div style={{ padding: "10px 14px 11px", flex: 1, minWidth: 0 }}>
            {/* Author line */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <BryptoLogo size={16} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: "#dbdee1" }}>Brypto Call Engine</span>
            </div>

            {/* Title + status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: brightText, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: accent, fontSize: 12 }}>{isLong ? "▲" : "▼"}</span>
                {call.pair || "BTC/USDT"}
                <span style={{
                  fontSize: 9.5, fontWeight: 700, padding: "2px 5px", borderRadius: 3,
                  background: isLong ? COLORS.longBg : COLORS.shortBg, color: accent,
                }}>{call.direction}</span>
                {call.orderType === "limit" && (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 4px", borderRadius: 3, background: "rgba(255,255,255,.04)", color: fieldColor }}>LIMIT</span>
                )}
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                background: st.bg, color: st.color,
              }}>{st.icon} {st.label}</span>
            </div>

            {/* Meta */}
            <div style={{ fontSize: 10.5, color: fieldColor, marginBottom: 10 }}>
              {call.analyst || "Analyst"} · {new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}
              {fields.timeframe && call.timeframe ? ` · ${call.timeframe}` : ""}
              {fields.tags && call.tag ? ` · ${call.tag}` : ""}
              {call.tradeId ? ` · ${call.tradeId}` : ""}
            </div>

            {/* Entry / SL Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: dcaList.length > 0 && wAvg ? "1fr 1fr 1fr" : "1fr 1fr",
              gap: 0, marginBottom: 10, borderRadius: 4, overflow: "hidden",
              border: "1px solid #3a3c43",
            }}>
              <div style={{ padding: "7px 10px", background: "rgba(255,255,255,.02)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: fieldColor, letterSpacing: ".4px", marginBottom: 2 }}>ENTRY{dcaList.length > 0 && call.entryPct ? ` (${call.entryPct}%)` : ""}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: brightText, fontFamily: "Consolas, monospace", letterSpacing: "-.3px" }}>
                  {call.entry ? formatPrice(call.entry) : "—"}
                </div>
              </div>
              {dcaList.length > 0 && wAvg && (
                <div style={{ padding: "7px 10px", background: "rgba(124,106,240,.03)", borderLeft: "1px solid #3a3c43" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: fieldColor, letterSpacing: ".4px", marginBottom: 2 }}>AVG ENTRY</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#a99bf5", fontFamily: "Consolas, monospace" }}>{formatPrice(wAvg)}</div>
                </div>
              )}
              <div style={{ padding: "7px 10px", background: "rgba(255,56,104,.025)", borderLeft: "1px solid #3a3c43" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: fieldColor, letterSpacing: ".4px", marginBottom: 2 }}>STOP LOSS</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.short, fontFamily: "Consolas, monospace" }}>
                    {call.sl ? formatPrice(call.sl) : "—"}
                  </span>
                  {slPct && <span style={{ fontSize: 9.5, color: COLORS.short, opacity: 0.6, fontWeight: 600 }}>-{slPct}%</span>}
                </div>
              </div>
            </div>

            {/* Badges */}
            {((fields.leverage && call.leverage) || dcaList.length > 0 || call.definedRisk) && (
              <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                {call.definedRisk && (
                  <span style={{ padding: "3px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: COLORS.shortBg, color: COLORS.short }}>
                    🎯 Risk: {call.definedRisk}{call.riskUnit === "pct" ? "% portfolio" : "R"}
                  </span>
                )}
                {fields.leverage && call.leverage && (
                  <span style={{ padding: "3px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: COLORS.goldBg, color: COLORS.gold }}>
                    ⚡ {call.leverage}x
                  </span>
                )}
                {dcaList.length > 0 && (
                  <span style={{ padding: "3px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600, background: COLORS.brandBg, color: COLORS.brand }}>
                    DCA: {dcaList.length} level{dcaList.length > 1 ? "s" : ""}
                    {(() => {
                      const total = allocationTotal(call.entryPct, dcaList);
                      if (total < 99.5) return ` · ${Math.round(total)}% filled`;
                      return "";
                    })()}
                  </span>
                )}
              </div>
            )}

            {/* DCA Detail */}
            {fields.dca && dcaList.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: fieldColor, letterSpacing: ".4px", marginBottom: 5 }}>POSITION ALLOCATION</div>
                {/* Main entry as first level */}
                {call.entry && call.entryPct && (
                  <div style={{
                    display: "flex", justifyContent: "space-between", padding: "3px 8px",
                    borderRadius: 3, background: "rgba(0,223,163,.03)", marginBottom: 2,
                    borderLeft: `2px solid ${COLORS.long}30`,
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.long, width: 10 }}>E</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "Consolas, monospace", color: "#dddfe4" }}>{formatPrice(call.entry)}</span>
                      <span style={{ fontSize: 9.5, color: fieldColor, fontStyle: "italic" }}>entry</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.long }}>{call.entryPct}%</span>
                  </div>
                )}
                {dcaList.map((d, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "3px 8px",
                    borderRadius: 3, background: "rgba(255,255,255,.015)", marginBottom: 2,
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: fieldColor, width: 10 }}>{i + 1}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "Consolas, monospace", color: "#dddfe4" }}>{formatPrice(d.price)}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.brand }}>{d.pct}%</span>
                  </div>
                ))}
                {/* Partial position note */}
                {(() => {
                  const entryOnly = parseFloat(call.entryPct) || 0;
                  if (entryOnly < 99.5 && dcaList.length > 0 && effectiveEntry) {
                    // If only entry fills (no DCAs)
                    const entryOnlyR = calcRR(call.entry, call.sl, targets.length > 0 ? targets[targets.length - 1].price : 0);
                    return (
                      <div style={{ fontSize: 9.5, color: fieldColor, padding: "3px 8px", marginTop: 3, fontStyle: "italic" }}>
                        💡 Entry only ({entryOnly}%): R = {entryOnlyR || "—"} · Full fill: R = {maxRR || "—"}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Targets */}
            {targets.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: fieldColor, letterSpacing: ".4px", marginBottom: 5 }}>TARGETS</div>
                {targets.map((t, i) => {
                  const r = calcRR(effectiveEntry || call.entry, call.sl, t.price);
                  const tp = pctDiff(effectiveEntry || call.entry, t.price);
                  const isLast = i === targets.length - 1 && targets.length > 1;
                  const isHit = t.hit;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "4px 8px", borderRadius: 3, marginBottom: 2,
                      background: isHit ? "rgba(0,223,163,.05)" : isLast ? (isLong ? "rgba(0,223,163,.03)" : "rgba(255,56,104,.03)") : "rgba(255,255,255,.015)",
                      borderLeft: `2px solid ${isHit ? COLORS.long : isLast ? accent : "transparent"}`,
                      opacity: isHit ? 0.65 : 1,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: isHit ? COLORS.long : isLast ? accent : fieldColor, width: 11, textAlign: "center" }}>
                          {isHit ? "✓" : isLast && targets.length > 1 ? "★" : i + 1}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 600, fontFamily: "Consolas, monospace",
                          color: isHit ? COLORS.long : isLast ? accent : "#dddfe4",
                          textDecoration: isHit ? "line-through" : "none",
                        }}>{formatPrice(t.price)}</span>
                        {tp && <span style={{ fontSize: 9.5, color: isLong ? COLORS.long : "#dddfe4", opacity: 0.4 }}>+{tp}%</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {t.trim && <span style={{ fontSize: 9.5, fontWeight: 600, color: fieldColor }}>{t.trim}%</span>}
                        {r && <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: MONO, color: parseFloat(r) >= 3 ? COLORS.long : parseFloat(r) >= 2 ? COLORS.gold : fieldColor }}>{r}R</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chart */}
            {(call.chartTv || call.chartImg) && (
              <div style={{ marginBottom: 10 }}>
                {call.chartImg && (
                  <img
                    src={call.chartImg}
                    alt="Chart"
                    style={{
                      width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 4,
                      marginBottom: 4, border: "1px solid #3a3c43", display: "block",
                    }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                )}
                {call.chartTv && (
                  <div style={{
                    padding: "4px 8px", borderRadius: 3, background: "rgba(255,255,255,.02)",
                    border: "1px solid #3a3c43", display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span style={{ fontSize: 12 }}>📊</span>
                    <span style={{ fontSize: 11, color: COLORS.info, fontWeight: 500 }}>View Chart on TradingView ↗</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {call.notes && (
              <div style={{
                fontSize: 11.5, color: "#a0a4b4", lineHeight: 1.4, padding: "5px 8px",
                background: "rgba(255,255,255,.015)", borderRadius: 3,
                borderLeft: `2px solid ${COLORS.brand}30`, marginBottom: 10, fontStyle: "italic",
              }}>{call.notes}</div>
            )}

            {/* Invalidation */}
            {fields.invalidation && call.invalidation && (
              <div style={{
                fontSize: 10.5, color: "#e85050", padding: "4px 8px",
                background: "rgba(255,56,104,.03)", borderRadius: 3,
                marginBottom: 10, borderLeft: `2px solid ${COLORS.short}30`,
              }}>⚠ {call.invalidation}</div>
            )}

            {/* Updates timeline */}
            {updates.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: fieldColor, letterSpacing: ".4px", marginBottom: 5 }}>UPDATES</div>
                {updates.map((u, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "3px 8px",
                    borderRadius: 3, background: "rgba(255,255,255,.015)",
                    borderLeft: `2px solid ${u.color || COLORS.info}30`, marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 10 }}>{u.icon}</span>
                    <span style={{ fontSize: 11, color: "#b5b9c9", flex: 1 }}>{u.text}</span>
                    <span style={{ fontSize: 9.5, color: dimText }}>{u.time}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: 6, borderTop: "1px solid #3a3c43",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <BryptoLogo size={12} />
                <span style={{ fontSize: 9.5, color: dimText }}>Brypto</span>
              </div>
              {maxRR && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {(() => {
                    const wR = weightedRealizedR(effectiveEntry || call.entry, call.sl, call.targets);
                    if (wR && call.targets.some(t => t.trim)) {
                      return <span style={{ fontSize: 10, color: "#80848e" }}>Weighted: <span style={{ fontWeight: 700, color: parseFloat(wR) >= 2 ? COLORS.long : COLORS.gold }}>{wR}R</span></span>;
                    }
                    return null;
                  })()}
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: parseFloat(maxRR) >= 3 ? COLORS.long : COLORS.gold }}>
                    <span style={{ fontSize: 9, color: dimText, fontWeight: 500, marginRight: 2 }}>Max</span>{maxRR}R
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BASIC EMBED (External servers)
// ══════════════════════════════════════════════════════════════
function BasicEmbed({ call }) {
  const isLong = call.direction === "LONG";
  const accent = isLong ? COLORS.long : COLORS.short;
  const targets = (call.targets || []).filter(t => t.price);
  const eff = parseFloat(call.entry);
  const maxRR = targets.length && eff ? calcRR(eff, call.sl, targets[targets.length - 1].price) : null;

  return (
    <div style={{ background: "#313338", borderRadius: 8, padding: "12px 12px 8px", fontFamily: "'gg sans', 'Noto Sans', Helvetica, Arial, sans-serif" }}>
      <div style={{ display: "flex", gap: 9, marginBottom: 6 }}>
        <div style={{ flexShrink: 0 }}><BryptoLogo size={38} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, paddingTop: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#f2f3f5" }}>Trade Alert</span>
          <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: COLORS.blue, color: "#fff", fontWeight: 500, lineHeight: "14px" }}>BOT</span>
        </div>
      </div>
      <div style={{ marginLeft: 47 }}>
        <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", background: "#2b2d31", border: "1px solid #26282e" }}>
          <div style={{ width: 4, background: accent, flexShrink: 0 }} />
          <div style={{ padding: "10px 14px 11px", flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f2f3f5", marginBottom: 8 }}>
              {isLong ? "🟢" : "🔴"} {call.pair || "BTC/USDT"} — {call.direction}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#80848e", marginBottom: 2 }}>Entry</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f2f3f5", fontFamily: "Consolas, monospace" }}>{call.entry ? formatPrice(call.entry) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#80848e", marginBottom: 2 }}>Stop Loss</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.short, fontFamily: "Consolas, monospace" }}>{call.sl ? formatPrice(call.sl) : "—"}</div>
              </div>
            </div>
            {targets.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#80848e", marginBottom: 4 }}>Targets</div>
                {targets.map((t, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: "#dddfe4", fontFamily: "Consolas, monospace", padding: "2px 0" }}>
                    {i + 1}. {formatPrice(t.price)}
                  </div>
                ))}
              </div>
            )}
            {call.notes && <div style={{ fontSize: 11.5, color: "#a0a4b4", fontStyle: "italic", marginBottom: 8 }}>{call.notes}</div>}
            <div style={{ fontSize: 9.5, color: "#5d616b", paddingTop: 6, borderTop: "1px solid #3a3c43" }}>
              via Brypto{maxRR ? ` · R:R ${maxRR}:1` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Clipboard text ──
function generateClipboardText(call, fields) {
  const isLong = call.direction === "LONG";
  const targets = (call.targets || []).filter(t => t.price);
  const dcaList = (call.dcas || []).filter(d => d.price);
  const wAvg = dcaList.length ? weightedAvgEntry(call.entry, call.entryPct, dcaList) : null;
  const eff = wAvg || parseFloat(call.entry);

  let lines = [];
  let header = `${isLong ? "🟢" : "🔴"} ${call.direction} — ${call.pair || "BTC/USDT"}`;
  if (call.orderType === "limit") header += " (Limit)";
  if (fields.timeframe && call.timeframe) header += ` (${call.timeframe})`;
  if (fields.tags && call.tag) header += ` [${call.tag}]`;
  lines.push(header, "");
  lines.push(`📍 Entry: ${call.entry ? formatPrice(call.entry) : "—"}${dcaList.length > 0 && call.entryPct ? ` (${call.entryPct}%)` : ""}`);
  if (dcaList.length && wAvg) {
    dcaList.forEach((d, i) => lines.push(`   DCA ${i + 1}: ${formatPrice(d.price)} (${d.pct}%)`));
    lines.push(`   Avg: ${formatPrice(wAvg)}`);
  }
  lines.push(`🛑 SL: ${call.sl ? formatPrice(call.sl) : "—"}${eff ? ` (-${pctDiff(eff, call.sl) || "?"}%)` : ""}`);
  if (call.definedRisk) lines.push(`🎯 Risk: ${call.definedRisk}${call.riskUnit === "pct" ? "% portfolio" : "R"}`);
  if (fields.leverage && call.leverage) lines.push(`⚡ ${call.leverage}x`);
  lines.push("");
  if (targets.length) {
    lines.push("🎯 Targets:");
    targets.forEach((t, i) => {
      const r = calcRR(eff, call.sl, t.price);
      lines.push(`  ${i + 1}. ${formatPrice(t.price)}${t.trim ? ` (${t.trim}%)` : ""}${r ? ` — ${r}R` : ""}`);
    });
    lines.push("");
  }
  if (call.notes) lines.push(`💬 ${call.notes}`, "");
  if (call.chartTv) lines.push(`📊 ${call.chartTv}`, "");
  lines.push("— Brypto");
  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ══════════════════════════════════════════════════════════════
export default function BryptoCallEngine() {
  const [view, setView] = useState("call");

  const [call, setCall] = useState({
    tradeId: makeTradeId(),
    pair: "",
    direction: "LONG",
    orderType: "market",
    entry: "",
    entryPct: "100",
    definedRisk: "",
    riskUnit: "pct",
    sl: "",
    targets: [
      { price: "", trim: "", hit: false },
      { price: "", trim: "", hit: false },
      { price: "", trim: "", hit: false },
    ],
    dcas: [],
    notes: "",
    analyst: "esco",
    leverage: "",
    timeframe: "",
    tag: "",
    invalidation: "",
    chartTv: "",
    chartImg: "",
    status: "pending",
    updates: [],
  });

  const [fields, setFields] = useState({
    leverage: false, dca: false, timeframe: false, tags: false,
    invalidation: false, notes: true, rr: true, trims: true, chart: false,
  });

  const [showFields, setShowFields] = useState(false);
  const [equalTrim, setEqualTrim] = useState(false);
  const [previewSkin, setPreviewSkin] = useState("premium");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateType, setUpdateType] = useState("be");
  const [updateNote, setUpdateNote] = useState("");

  const [webhooks, setWebhooks] = useState([
    { id: "1", name: "Brypto Main", url: "https://discord.com/api/webhooks/...", on: true, skin: "premium" },
    { id: "2", name: "VIP Calls", url: "https://discord.com/api/webhooks/...", on: true, skin: "premium" },
    { id: "3", name: "Pepe Server", url: "https://discord.com/api/webhooks/...", on: true, skin: "basic" },
    { id: "4", name: "Alpha Chat", url: "https://discord.com/api/webhooks/...", on: true, skin: "basic" },
  ]);
  const [showAddWH, setShowAddWH] = useState(false);
  const [newWH, setNewWH] = useState({ name: "", url: "", skin: "basic" });

  // Updaters
  const updateCall = (key, value) => setCall(prev => ({ ...prev, [key]: value }));
  const updateTarget = (index, key, value) => {
    setCall(prev => {
      const targets = [...prev.targets];
      targets[index] = { ...targets[index], [key]: value };
      return { ...prev, targets };
    });
  };
  const addTarget = () => setCall(prev => ({ ...prev, targets: [...prev.targets, { price: "", trim: "", hit: false }] }));
  const removeTarget = (i) => setCall(prev => ({ ...prev, targets: prev.targets.filter((_, j) => j !== i) }));
  const addDCA = () => setCall(prev => ({ ...prev, dcas: [...prev.dcas, { price: "", pct: "" }] }));
  const updateDCA = (i, k, v) => setCall(prev => { const d = [...prev.dcas]; d[i] = { ...d[i], [k]: v }; return { ...prev, dcas: d }; });
  const removeDCA = (i) => setCall(prev => ({ ...prev, dcas: prev.dcas.filter((_, j) => j !== i) }));

  const flash = (msg, type) => { setToast({ msg, type: type || "ok" }); setTimeout(() => setToast(null), 2500); };

  const isLong = call.direction === "LONG";
  const accent = isLong ? COLORS.long : COLORS.short;
  const canSend = call.pair && call.entry && call.sl && call.targets.some(t => t.price);
  const activeWH = webhooks.filter(w => w.on).length;
  const canCalcR = parseFloat(call.entry) > 0 && parseFloat(call.sl) > 0;

  // Equal trim auto-calc
  useEffect(() => {
    if (!equalTrim) return;
    const active = call.targets.filter(t => t.price);
    if (!active.length) return;
    const each = Math.floor(100 / active.length);
    const remainder = 100 - each * active.length;
    setCall(prev => ({
      ...prev,
      targets: prev.targets.map((t, i) => {
        if (!t.price) return t;
        const idx = prev.targets.filter((x, j) => x.price && j <= i).length - 1;
        return { ...t, trim: String(idx === active.length - 1 ? each + remainder : each) };
      }),
    }));
  }, [equalTrim, call.targets.map(t => t.price).join(",")]);

  const fillAllR = () => {
    if (!canCalcR) return;
    setCall(prev => ({
      ...prev,
      targets: [
        { price: getRTarget(prev.entry, prev.sl, 1, prev.direction), trim: equalTrim ? "34" : "", hit: false },
        { price: getRTarget(prev.entry, prev.sl, 2, prev.direction), trim: equalTrim ? "33" : "", hit: false },
        { price: getRTarget(prev.entry, prev.sl, 3, prev.direction), trim: equalTrim ? "33" : "", hit: false },
      ],
    }));
  };

  const quickAddR = (mult) => {
    const val = getRTarget(call.entry, call.sl, mult, call.direction);
    if (!val) return;
    setCall(prev => {
      const targets = [...prev.targets];
      const emptyIdx = targets.findIndex(x => !x.price);
      if (emptyIdx >= 0) targets[emptyIdx] = { ...targets[emptyIdx], price: val };
      else targets.push({ price: val, trim: "", hit: false });
      return { ...prev, targets };
    });
  };

  const handleSend = () => {
    if (!canSend) return;
    setSent(true);
    flash(`Sending to ${activeWH} servers...`);
    setHistory(prev => [{ id: Date.now(), ...call, ts: Date.now(), dist: activeWH }, ...prev]);
    updateCall("status", "active");
    setTimeout(() => { setSent(false); flash(`✓ Distributed to ${activeWH} servers`); }, 1100);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateClipboardText(call, fields)).then(() => {
      setCopied(true);
      flash("Copied — paste anywhere");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleUpdate = () => {
    const types = {
      be: { icon: "🔒", text: "SL → break even", color: COLORS.info, status: "break_even" },
      tp_partial: { icon: "✅", text: `Partial TP${updateNote ? ` — ${updateNote}` : ""}`, color: COLORS.long, status: "partial" },
      closed: { icon: "💰", text: `Closed${updateNote ? ` — ${updateNote}` : ""}`, color: COLORS.long, status: "closed" },
      invalidated: { icon: "❌", text: `Invalidated${updateNote ? ` — ${updateNote}` : ""}`, color: COLORS.short, status: "invalidated" },
      stopped: { icon: "🛑", text: "Stopped out", color: COLORS.short, status: "stopped" },
      sl_moved: { icon: "🔄", text: `SL → ${updateNote || "moved"}`, color: COLORS.gold, status: null },
      note: { icon: "📝", text: updateNote || "Note", color: COLORS.brand, status: null },
    };
    const u = types[updateType];
    if (!u) return;
    const newUpdate = {
      icon: u.icon,
      text: u.text,
      color: u.color,
      time: new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }),
    };
    setCall(prev => ({
      ...prev,
      updates: [...prev.updates, newUpdate],
      status: u.status || prev.status,
    }));
    setUpdateNote("");
    setShowUpdate(false);
    flash("Update posted");
  };

  const clearCall = () => {
    setCall({
      tradeId: makeTradeId(),
      pair: "", direction: call.direction, orderType: "market", entry: "", entryPct: "100", definedRisk: "", riskUnit: "pct", sl: "",
      targets: [{ price: "", trim: "", hit: false }, { price: "", trim: "", hit: false }, { price: "", trim: "", hit: false }],
      dcas: [], notes: "", analyst: "esco", leverage: "", timeframe: "", tag: "",
      invalidation: "", chartTv: "", chartImg: "", status: "pending", updates: [],
    });
  };

  const navItems = [
    { id: "call", icon: "⚡", label: "Call" },
    { id: "webhooks", icon: "🔗", label: "Servers" },
    { id: "history", icon: "📋", label: "History" },
    { id: "admin", icon: "⚙️", label: "Admin" },
    { id: "discord", icon: "🤖", label: "Discord" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        textarea { resize: vertical; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 999,
          padding: "8px 16px", borderRadius: 7,
          background: toast.type === "ok" ? "#0c1a14" : "#1a1510",
          border: `1px solid ${toast.type === "ok" ? COLORS.long + "20" : COLORS.gold + "20"}`,
          color: toast.type === "ok" ? COLORS.long : COLORS.gold,
          fontSize: 12, fontWeight: 600, fontFamily: FONT,
          boxShadow: "0 6px 24px rgba(0,0,0,.5)",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <header style={{
        padding: "9px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${COLORS.border}`, background: COLORS.panel,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <BryptoLogo size={28} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-.2px", lineHeight: 1.2 }}>Brypto</div>
            <div style={{ fontSize: 9, color: COLORS.dim }}>Call Engine</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 1, background: COLORS.card, borderRadius: 6, padding: 2, border: `1px solid ${COLORS.border}` }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              padding: "5px 13px", borderRadius: 5, border: "none", cursor: "pointer",
              background: view === n.id ? COLORS.brandBg : "transparent",
              color: view === n.id ? COLORS.text : COLORS.muted,
              fontSize: 11.5, fontWeight: 600, fontFamily: FONT, transition: "all .1s",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 10 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.brand, boxShadow: `0 0 5px ${COLORS.brand}50` }} />
          <span style={{ fontSize: 10, color: COLORS.muted }}>{activeWH} active</span>
        </div>
      </header>

      {/* Main */}
      <main style={{ padding: "18px 22px", maxWidth: 1280, margin: "0 auto" }}>

        {/* ═══ CALL VIEW ═══ */}
        {view === "call" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            {/* LEFT: Form */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.3px" }}>New Call</h2>
                  <p style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 1 }}>Entry + SL → auto R → distribute.</p>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <ActionButton small outline color={COLORS.muted} onClick={() => setShowFields(!showFields)}>⚙ Fields</ActionButton>
                  <ActionButton small outline color={COLORS.dim} onClick={clearCall}>Clear</ActionButton>
                </div>
              </div>

              {/* Field toggles */}
              {showFields && (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.brandBdr}`, borderRadius: 9, padding: "12px 16px", marginBottom: 10 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.brand, letterSpacing: ".5px", marginBottom: 7, textTransform: "uppercase" }}>Visible Fields</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <ToggleSwitch on={fields.notes} onToggle={() => setFields(p => ({ ...p, notes: !p.notes }))} label="Notes" />
                    <ToggleSwitch on={fields.trims} onToggle={() => setFields(p => ({ ...p, trims: !p.trims }))} label="Trim %" />
                    <ToggleSwitch on={fields.leverage} onToggle={() => setFields(p => ({ ...p, leverage: !p.leverage }))} label="Leverage" />
                    <ToggleSwitch on={fields.dca} onToggle={() => setFields(p => ({ ...p, dca: !p.dca }))} label="DCA Zones" />
                    <ToggleSwitch on={fields.timeframe} onToggle={() => setFields(p => ({ ...p, timeframe: !p.timeframe }))} label="Timeframe" />
                    <ToggleSwitch on={fields.tags} onToggle={() => setFields(p => ({ ...p, tags: !p.tags }))} label="Trade Tag" />
                    <ToggleSwitch on={fields.invalidation} onToggle={() => setFields(p => ({ ...p, invalidation: !p.invalidation }))} label="Invalidation" />
                    <ToggleSwitch on={fields.chart} onToggle={() => setFields(p => ({ ...p, chart: !p.chart }))} label="Chart" />
                  </div>
                </div>
              )}

              {/* Form */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Direction + order type */}
                <div style={{ display: "flex", gap: 7 }}>
                  <div style={{ flex: 1, display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
                    {["LONG", "SHORT"].map(d => (
                      <button key={d} onClick={() => updateCall("direction", d)} style={{
                        flex: 1, padding: "8px 0", border: "none", cursor: "pointer",
                        background: call.direction === d ? (d === "LONG" ? COLORS.long : COLORS.short) : COLORS.bg,
                        color: call.direction === d ? (d === "LONG" ? "#060709" : "#fff") : COLORS.dim,
                        fontSize: 11.5, fontWeight: 800, letterSpacing: "1.2px", fontFamily: FONT, transition: "all .1s",
                      }}>{d === "LONG" ? "▲ LONG" : "▼ SHORT"}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {["market", "limit"].map(o => (
                      <PillButton key={o} small active={call.orderType === o} color={COLORS.sub} onClick={() => updateCall("orderType", o)}>
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                      </PillButton>
                    ))}
                  </div>
                </div>

                {/* Pair + optional inline fields */}
                <div style={{ display: "flex", gap: 7, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <TextInput label="Pair" value={call.pair} onChange={v => updateCall("pair", v.toUpperCase())} placeholder="BTC/USDT" autoFocus flex={2} />
                  {fields.timeframe && (
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: ".7px", textTransform: "uppercase" }}>TF</div>
                      <div style={{ display: "flex", gap: 2 }}>
                        {["1H", "4H", "1D", "1W"].map(tf => (
                          <PillButton key={tf} small active={call.timeframe === tf} onClick={() => updateCall("timeframe", call.timeframe === tf ? "" : tf)}>{tf}</PillButton>
                        ))}
                      </div>
                    </div>
                  )}
                  {fields.tags && (
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: ".7px", textTransform: "uppercase" }}>Type</div>
                      <div style={{ display: "flex", gap: 2 }}>
                        {["Scalp", "Swing", "Position"].map(tg => (
                          <PillButton key={tg} small active={call.tag === tg} onClick={() => updateCall("tag", call.tag === tg ? "" : tg)}>{tg}</PillButton>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Entry + SL */}
                <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
                  <TextInput label="Entry" value={call.entry} onChange={v => updateCall("entry", v)} placeholder="Entry price" type="number" mono />
                  {fields.dca && (
                    <TextInput label="Entry %" value={call.entryPct} onChange={v => updateCall("entryPct", v)} placeholder="%" type="number" mono suffix="%" style={{ maxWidth: 72 }} />
                  )}
                  <TextInput label="Stop Loss" value={call.sl} onChange={v => updateCall("sl", v)} placeholder="Stop price" type="number" mono />
                  {pctDiff(call.entry, call.sl) && (
                    <div style={{
                      padding: "6px 9px", borderRadius: 5, background: COLORS.shortBg,
                      border: `1px solid ${COLORS.shortBdr}`, height: 33,
                      display: "flex", alignItems: "center", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.short, fontFamily: MONO }}>-{pctDiff(call.entry, call.sl)}%</span>
                    </div>
                  )}
                </div>

                {/* Defined Risk */}
                <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: ".7px", textTransform: "uppercase" }}>
                      Defined Risk
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <TextInput small value={call.definedRisk} onChange={v => updateCall("definedRisk", v)} placeholder={call.riskUnit === "pct" ? "e.g. 1" : "e.g. 0.5"} type="number" mono />
                      <div style={{ display: "flex", gap: 2 }}>
                        {[{id: "pct", label: "% Port"}, {id: "r", label: "R"}].map(u => (
                          <PillButton key={u.id} small active={call.riskUnit === u.id} color={COLORS.short} onClick={() => updateCall("riskUnit", u.id)}>{u.label}</PillButton>
                        ))}
                      </div>
                    </div>
                  </div>
                  {call.definedRisk && pctDiff(call.entry, call.sl) && (
                    <div style={{
                      padding: "5px 9px", borderRadius: 5, background: COLORS.brandBg,
                      border: `1px solid ${COLORS.brandBdr}`,
                      display: "flex", alignItems: "center", flexShrink: 0, gap: 4,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.brand, fontFamily: MONO }}>
                        Risk: {call.definedRisk}{call.riskUnit === "pct" ? "%" : "R"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Leverage */}
                {fields.leverage && (
                  <TextInput label="Leverage" value={call.leverage} onChange={v => updateCall("leverage", v)} placeholder="10" type="number" mono suffix="x" />
                )}

                {/* DCA */}
                {fields.dca && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, letterSpacing: ".7px", textTransform: "uppercase" }}>DCA Levels</span>
                      <div style={{ display: "flex", gap: 3 }}>
                        <button onClick={() => {
                          // Auto-fill: distribute remaining % to last empty DCA or entry
                          const total = allocationTotal(call.entryPct, call.dcas);
                          if (total < 100 && call.dcas.length > 0) {
                            const remaining = 100 - total;
                            const lastIdx = call.dcas.length - 1;
                            const lastDca = call.dcas[lastIdx];
                            if (!lastDca.pct || parseFloat(lastDca.pct) === 0) {
                              updateDCA(lastIdx, "pct", String(Math.round(remaining)));
                            } else {
                              // Add remaining to the last one
                              updateDCA(lastIdx, "pct", String(Math.round(parseFloat(lastDca.pct) + remaining)));
                            }
                          }
                        }} style={{
                          background: "transparent", border: `1px dashed ${COLORS.brandBdr}`, borderRadius: 12,
                          color: COLORS.brand, fontSize: 9.5, fontWeight: 600, padding: "2px 7px", cursor: "pointer", fontFamily: FONT,
                        }}>Auto %</button>
                        <button onClick={addDCA} style={{
                          background: "transparent", border: `1px dashed ${COLORS.bd2}`, borderRadius: 12,
                          color: COLORS.muted, fontSize: 9.5, fontWeight: 600, padding: "2px 7px", cursor: "pointer", fontFamily: FONT,
                        }}>+ Add</button>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10.5, color: COLORS.dim, marginBottom: 6, lineHeight: 1.4,
                      padding: "5px 8px", background: COLORS.bg, borderRadius: 5, border: `1px solid ${COLORS.border}`,
                    }}>
                      💡 Entry % + all DCA % should add up to <strong style={{ color: COLORS.sub }}>100%</strong>. Example: 50% at entry, 30% DCA1, 20% DCA2.
                    </div>
                    {call.dcas.map((d, i) => (
                      <div key={i} style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.dim, width: 14, textAlign: "center" }}>{i + 1}</span>
                        <TextInput small value={d.price} onChange={v => updateDCA(i, "price", v)} placeholder="Price" type="number" mono />
                        <TextInput small value={d.pct} onChange={v => updateDCA(i, "pct", v)} placeholder="%" type="number" mono suffix="%" style={{ maxWidth: 72 }} />
                        <button onClick={() => removeDCA(i)} style={{
                          background: "transparent", border: "none", cursor: "pointer", color: COLORS.dim, fontSize: 12,
                        }} onMouseEnter={e => e.currentTarget.style.color = COLORS.short} onMouseLeave={e => e.currentTarget.style.color = COLORS.dim}>×</button>
                      </div>
                    ))}
                    {/* Allocation total + weighted avg */}
                    {call.dcas.length > 0 && (
                      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "4px 0 0 20px" }}>
                        {weightedAvgEntry(call.entry, call.entryPct, call.dcas) && (
                          <span style={{ fontSize: 10.5, color: COLORS.brand, fontFamily: MONO }}>
                            Avg: {formatPrice(weightedAvgEntry(call.entry, call.entryPct, call.dcas))}
                          </span>
                        )}
                        {(() => {
                          const total = allocationTotal(call.entryPct, call.dcas);
                          const isGood = Math.abs(total - 100) < 0.5;
                          return (
                            <span style={{
                              fontSize: 10, fontWeight: 600, fontFamily: MONO,
                              color: isGood ? COLORS.long : total > 100 ? COLORS.short : COLORS.gold,
                            }}>
                              {isGood ? "✓" : "⚠"} {total.toFixed(0)}% allocated
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Targets */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, letterSpacing: ".7px", textTransform: "uppercase" }}>Targets</span>
                    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                      {canCalcR && (
                        <>
                          <PillButton small color={COLORS.long} onClick={() => quickAddR(1)}>+1R</PillButton>
                          <PillButton small color={COLORS.long} onClick={() => quickAddR(2)}>+2R</PillButton>
                          <PillButton small color={COLORS.long} onClick={() => quickAddR(3)}>+3R</PillButton>
                          <PillButton small color={COLORS.brand} onClick={fillAllR}>Auto</PillButton>
                        </>
                      )}
                      {fields.trims && (
                        <PillButton small color={COLORS.gold} active={equalTrim} onClick={() => setEqualTrim(!equalTrim)}>= Trim</PillButton>
                      )}
                      {fields.trims && !equalTrim && (
                        <button onClick={() => {
                          const trimTotal = call.targets.reduce((s, t) => s + (parseFloat(t.trim) || 0), 0);
                          if (trimTotal < 100) {
                            const remaining = 100 - trimTotal;
                            // Find last target with a price but no trim
                            const lastIdx = [...call.targets].reverse().findIndex(t => t.price && (!t.trim || parseFloat(t.trim) === 0));
                            if (lastIdx >= 0) {
                              updateTarget(call.targets.length - 1 - lastIdx, "trim", String(Math.round(remaining)));
                            }
                          }
                        }} style={{
                          background: "transparent", border: `1px dashed ${COLORS.goldBg}`, borderRadius: 12,
                          color: COLORS.gold, fontSize: 9.5, fontWeight: 600, padding: "2px 7px", cursor: "pointer", fontFamily: FONT,
                        }}>Auto %</button>
                      )}
                      <button onClick={addTarget} style={{
                        background: "transparent", border: `1px dashed ${COLORS.bd2}`, borderRadius: 12,
                        color: COLORS.muted, fontSize: 9.5, fontWeight: 600, padding: "2px 7px", cursor: "pointer", fontFamily: FONT,
                      }}>+</button>
                    </div>
                  </div>
                  {fields.trims && !equalTrim && call.targets.some(t => t.price) && (
                    <div style={{
                      fontSize: 10.5, color: COLORS.dim, marginBottom: 6, lineHeight: 1.4,
                      padding: "5px 8px", background: COLORS.bg, borderRadius: 5, border: `1px solid ${COLORS.border}`,
                    }}>
                      💡 Trim % = how much to close at each TP. Should total <strong style={{ color: COLORS.sub }}>100%</strong>.
                    </div>
                  )}
                  {call.targets.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8.5, fontWeight: 700, background: COLORS.bg, color: COLORS.muted,
                        border: `1px solid ${COLORS.border}`, flexShrink: 0,
                      }}>{i + 1}</span>
                      <TextInput
                        small value={t.price}
                        onChange={v => updateTarget(i, "price", v)}
                        placeholder={canCalcR ? formatPrice(getRTarget(call.entry, call.sl, i + 1, call.direction)) : `TP ${i + 1}`}
                        type="number" mono
                      />
                      {fields.trims && !equalTrim && (
                        <TextInput small value={t.trim} onChange={v => updateTarget(i, "trim", v)} placeholder="Trim" type="number" mono suffix="%" style={{ maxWidth: 72 }} />
                      )}
                      {fields.trims && equalTrim && t.trim && (
                        <span style={{ fontSize: 9.5, fontWeight: 600, color: COLORS.gold, fontFamily: MONO, width: 30, textAlign: "right", flexShrink: 0 }}>{t.trim}%</span>
                      )}
                      {(() => {
                        const dcaList = (call.dcas || []).filter(d => d.price);
                        const wAvg = dcaList.length > 0 ? weightedAvgEntry(call.entry, call.entryPct, dcaList) : null;
                        const effEntry = wAvg || call.entry;
                        const r = calcRR(effEntry, call.sl, t.price);
                        return r ? (
                          <span style={{
                            fontSize: 10.5, fontWeight: 700, fontFamily: MONO, width: 28, textAlign: "right", flexShrink: 0,
                            color: parseFloat(r) >= 3 ? COLORS.long : parseFloat(r) >= 2 ? COLORS.gold : COLORS.muted,
                          }}>{r}R</span>
                        ) : <span style={{ width: 28, flexShrink: 0 }} />;
                      })()}
                      {call.targets.length > 1 && (
                        <button onClick={() => removeTarget(i)} style={{
                          background: "transparent", border: "none", cursor: "pointer", color: COLORS.dim, fontSize: 12,
                        }} onMouseEnter={e => e.currentTarget.style.color = COLORS.short} onMouseLeave={e => e.currentTarget.style.color = COLORS.dim}>×</button>
                      )}
                    </div>
                  ))}
                  {/* Trim total indicator */}
                  {fields.trims && call.targets.some(t => t.trim) && (() => {
                    const trimTotal = call.targets.reduce((s, t) => s + (parseFloat(t.trim) || 0), 0);
                    const isGood = Math.abs(trimTotal - 100) < 0.5;
                    return (
                      <div style={{ padding: "3px 0 0 20px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, fontFamily: MONO,
                          color: isGood ? COLORS.long : trimTotal > 100 ? COLORS.short : COLORS.gold,
                        }}>
                          {isGood ? "✓" : "⚠"} {trimTotal.toFixed(0)}% total trim
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Notes */}
                {fields.notes && (
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: ".7px", textTransform: "uppercase" }}>Notes</div>
                    <textarea
                      value={call.notes} onChange={e => updateCall("notes", e.target.value)}
                      placeholder="Quick context..." rows={2}
                      style={{
                        width: "100%", padding: "6px 10px", background: COLORS.bg,
                        border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text,
                        fontSize: 12.5, fontFamily: FONT, outline: "none", lineHeight: 1.4,
                      }}
                      onFocus={e => e.target.style.borderColor = COLORS.brand}
                      onBlur={e => e.target.style.borderColor = COLORS.border}
                    />
                  </div>
                )}

                {fields.invalidation && (
                  <TextInput label="Invalidation" value={call.invalidation} onChange={v => updateCall("invalidation", v)} placeholder="e.g. Daily close below 60k" />
                )}

                {/* Chart */}
                {fields.chart && (
                  <div style={{ display: "flex", gap: 7 }}>
                    <TextInput label="TradingView Link" value={call.chartTv} onChange={v => updateCall("chartTv", v)} placeholder="https://tradingview.com/..." flex={2} />
                    <TextInput label="Chart Image URL" value={call.chartImg} onChange={v => updateCall("chartImg", v)} placeholder="https://..." flex={1} />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
                  <ActionButton color={accent} full disabled={!canSend} onClick={handleSend}
                    style={sent ? { background: COLORS.long, color: "#060709" } : {}}>
                    {sent ? "✓ Sent!" : `⚡ Send to ${activeWH} Server${activeWH !== 1 ? "s" : ""}`}
                  </ActionButton>
                  <ActionButton outline color={COLORS.sub} onClick={handleCopy} disabled={!canSend}>
                    {copied ? "✓" : "📋"}
                  </ActionButton>
                </div>

                {/* Trade updates */}
                {call.status !== "pending" && (
                  <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 8, marginTop: 2 }}>
                    {!showUpdate ? (
                      <ActionButton small outline color={COLORS.info} full onClick={() => setShowUpdate(true)}>📡 Post Update</ActionButton>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, letterSpacing: ".5px", textTransform: "uppercase" }}>Update</div>
                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          {[
                            { id: "be", label: "🔒 BE" },
                            { id: "sl_moved", label: "🔄 Move SL" },
                            { id: "tp_partial", label: "✅ TP Hit" },
                            { id: "closed", label: "💰 Close" },
                            { id: "invalidated", label: "❌ Invalid" },
                            { id: "stopped", label: "🛑 Stopped" },
                            { id: "note", label: "📝 Note" },
                          ].map(u => (
                            <PillButton key={u.id} small active={updateType === u.id}
                              color={u.id === "closed" || u.id === "tp_partial" ? COLORS.long : u.id === "invalidated" || u.id === "stopped" ? COLORS.short : COLORS.info}
                              onClick={() => setUpdateType(u.id)}>{u.label}</PillButton>
                          ))}
                        </div>
                        <TextInput small value={updateNote} onChange={setUpdateNote} placeholder="Details..." />
                        <div style={{ display: "flex", gap: 5 }}>
                          <ActionButton small color={COLORS.info} onClick={handleUpdate}>Post</ActionButton>
                          <ActionButton small outline color={COLORS.dim} onClick={() => setShowUpdate(false)}>Cancel</ActionButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Preview */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Preview</h2>
                  <p style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 1 }}>Live embed output.</p>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <StatusBadge status={call.status} />
                  <div style={{ display: "flex", gap: 1, background: COLORS.card, borderRadius: 5, padding: 1.5, border: `1px solid ${COLORS.border}` }}>
                    {["premium", "basic"].map(s => (
                      <button key={s} onClick={() => setPreviewSkin(s)} style={{
                        padding: "3px 9px", borderRadius: 4, border: "none", cursor: "pointer",
                        background: previewSkin === s ? COLORS.brandBg : "transparent",
                        color: previewSkin === s ? COLORS.text : COLORS.dim,
                        fontSize: 10, fontWeight: 600, fontFamily: FONT, textTransform: "capitalize",
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {previewSkin === "premium" ? <PremiumEmbed call={call} fields={fields} /> : <BasicEmbed call={call} />}

              {canSend && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: COLORS.dim, letterSpacing: ".4px", textTransform: "uppercase" }}>📋 Text</span>
                    <ActionButton small outline color={COLORS.muted} onClick={handleCopy}>{copied ? "✓" : "Copy"}</ActionButton>
                  </div>
                  <pre style={{
                    background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6,
                    padding: 10, fontSize: 10.5, color: COLORS.muted, fontFamily: MONO,
                    lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 160, overflow: "auto",
                  }}>{generateClipboardText(call, fields)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ WEBHOOKS ═══ */}
        {view === "webhooks" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Servers</h2>
                <p style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 1 }}>Webhook endpoints + skin per server.</p>
              </div>
              <ActionButton small onClick={() => setShowAddWH(!showAddWH)}>{showAddWH ? "Cancel" : "+ Add"}</ActionButton>
            </div>

            {showAddWH && (
              <div style={{
                background: COLORS.card, border: `1px solid ${COLORS.brandBdr}`, borderRadius: 8,
                padding: 12, marginBottom: 10, display: "flex", gap: 7, alignItems: "flex-end",
              }}>
                <TextInput label="Name" value={newWH.name} onChange={v => setNewWH(p => ({ ...p, name: v }))} placeholder="Server" />
                <TextInput label="URL" value={newWH.url} onChange={v => setNewWH(p => ({ ...p, url: v }))} placeholder="https://discord.com/api/webhooks/..." flex={2} />
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: ".7px", textTransform: "uppercase" }}>Skin</div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {["basic", "premium"].map(s => (
                      <PillButton key={s} small active={newWH.skin === s} color={s === "premium" ? COLORS.brand : COLORS.sub} onClick={() => setNewWH(p => ({ ...p, skin: s }))}>{s}</PillButton>
                    ))}
                  </div>
                </div>
                <ActionButton color={COLORS.long} small onClick={() => {
                  if (newWH.name && newWH.url) {
                    setWebhooks(p => [...p, { id: Date.now().toString(), ...newWH, on: true }]);
                    setNewWH({ name: "", url: "", skin: "basic" });
                    setShowAddWH(false);
                    flash("Added!");
                  }
                }}>Add</ActionButton>
              </div>
            )}

            {webhooks.map((w, i) => (
              <div key={w.id} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8,
                padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 5, transition: "border .1s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.bd2}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: w.on ? COLORS.long : COLORS.dim, boxShadow: w.on ? `0 0 4px ${COLORS.long}40` : "none" }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                      {w.name}
                      <span style={{
                        fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
                        background: w.skin === "premium" ? COLORS.brandBg : COLORS.infoBg,
                        color: w.skin === "premium" ? COLORS.brand : COLORS.info, textTransform: "capitalize",
                      }}>{w.skin}</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: COLORS.dim, fontFamily: MONO, marginTop: 1 }}>{w.url.slice(0, 40)}...</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ActionButton small outline color={COLORS.brand} onClick={() => flash(`Test → ${w.name}`)}>Test</ActionButton>
                  <PillButton small active={w.skin === "premium"} color={COLORS.brand}
                    onClick={() => setWebhooks(p => p.map(x => x.id === w.id ? { ...x, skin: x.skin === "premium" ? "basic" : "premium" } : x))}>
                    {w.skin === "premium" ? "⭐" : "↑"}
                  </PillButton>
                  <button onClick={() => setWebhooks(p => p.map(x => x.id === w.id ? { ...x, on: !x.on } : x))} style={{
                    background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 13, padding: 2,
                  }}>{w.on ? "⏸" : "▶"}</button>
                  <button onClick={() => setWebhooks(p => p.filter(x => x.id !== w.id))} style={{
                    background: "transparent", border: "none", cursor: "pointer", color: COLORS.dim, fontSize: 11, padding: 2,
                  }} onMouseEnter={e => e.currentTarget.style.color = COLORS.short} onMouseLeave={e => e.currentTarget.style.color = COLORS.dim}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {view === "history" && (
          <div style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>History</h2>
            <p style={{ fontSize: 10.5, color: COLORS.muted, marginBottom: 16 }}>All distributed calls.</p>
            {history.length === 0 ? (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 40, textAlign: "center", color: COLORS.dim }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
                <div style={{ fontSize: 12 }}>No calls yet.</div>
              </div>
            ) : history.map((h, i) => {
              const hL = h.direction === "LONG";
              return (
                <div key={h.id} style={{
                  background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 5,
                      background: hL ? COLORS.longBg : COLORS.shortBg,
                      border: `1px solid ${hL ? COLORS.longBdr : COLORS.shortBdr}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: hL ? COLORS.long : COLORS.short, fontWeight: 800,
                    }}>{hL ? "▲" : "▼"}</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {h.pair}{" "}
                        <span style={{ fontSize: 10, color: COLORS.muted, fontWeight: 400 }}>{formatPrice(h.entry)} → {h.targets.filter(t => t.price).length} TP</span>
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: MONO, marginTop: 1 }}>
                        {h.tradeId} · {new Date(h.ts).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <StatusBadge status={h.status} />
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, color: COLORS.long,
                      background: COLORS.longBg, padding: "2px 7px", borderRadius: 4, border: `1px solid ${COLORS.longBdr}`,
                    }}>→ {h.dist}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ADMIN ═══ */}
        {view === "admin" && (
          <div style={{ maxWidth: 850 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>Admin</h2>
            <p style={{ fontSize: 10.5, color: COLORS.muted, marginBottom: 16 }}>System health and operational visibility.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Calls Today", value: history.filter(h => Date.now() - h.ts < 86400000).length, icon: "⚡", color: COLORS.brand },
                { label: "Active WHs", value: activeWH, icon: "🔗", color: COLORS.long },
                { label: "Success Rate", value: "100%", icon: "✓", color: COLORS.long },
                { label: "Total Calls", value: history.length, icon: "📊", color: COLORS.gold },
              ].map((s, i) => (
                <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 10.5, color: COLORS.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{s.icon}</span>{s.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: MONO }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📡 System Status</h3>
              {[
                { name: "Call Engine API", status: "ok" },
                { name: "Webhook Distributor", status: "ok" },
                { name: "Embed Builder (Premium)", status: "ok" },
                { name: "Embed Builder (Basic)", status: "ok" },
                { name: "Discord Parser (Mode B)", status: "planned" },
                { name: "Performance Engine", status: "planned" },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 6, background: COLORS.bg, marginBottom: 3,
                }}>
                  <span style={{ fontSize: 12.5 }}>{s.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                    background: s.status === "ok" ? COLORS.longBg : COLORS.goldBg,
                    color: s.status === "ok" ? COLORS.long : COLORS.gold,
                  }}>{s.status === "ok" ? "✓ Live" : "⏳ Planned"}</span>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 18 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🔗 Webhook Health</h3>
              {webhooks.map(w => (
                <div key={w.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 6, background: COLORS.bg, marginBottom: 3,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: w.on ? COLORS.long : COLORS.dim }} />
                    <span style={{ fontSize: 12.5 }}>{w.name}</span>
                    <span style={{ fontSize: 9.5, color: COLORS.dim, textTransform: "capitalize" }}>{w.skin}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: w.on ? COLORS.long : COLORS.dim }}>{w.on ? "Active" : "Paused"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ DISCORD ═══ */}
        {view === "discord" && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>Discord Mode</h2>
            <p style={{ fontSize: 10.5, color: COLORS.muted, marginBottom: 16 }}>For analysts who prefer posting in Discord.</p>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📝 Template Format</h3>
              <pre style={{
                background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6,
                padding: 14, fontSize: 12, color: COLORS.long, fontFamily: MONO, lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>{`$call LONG BTC/USDT
entry: 95000
sl: 93000
tp: 97000, 99000, 101000
leverage: 10x
notes: Clean breakout above resistance`}</pre>
              <p style={{ fontSize: 11.5, color: COLORS.sub, marginTop: 12, lineHeight: 1.5 }}>
                Post in the designated call channel. Bot parses it, shows confirmation embed with ✅/❌, and distributes on confirm.
              </p>
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📡 Update Commands</h3>
              <pre style={{
                background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6,
                padding: 14, fontSize: 12, color: COLORS.gold, fontFamily: MONO, lineHeight: 1.8, whiteSpace: "pre-wrap",
              }}>{`$update BRY-2026-0001 sl_be
$update BRY-2026-0001 tp1_hit
$update BRY-2026-0001 close "Profit at resistance"
$update BRY-2026-0001 sl 94500`}</pre>
            </div>
            <div style={{
              marginTop: 14, padding: "12px 16px", background: COLORS.goldBg,
              border: `1px solid ${COLORS.gold}20`, borderRadius: 8,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gold }}>⏳ Status: Phase 2</div>
              <div style={{ fontSize: 11, color: COLORS.sub, marginTop: 3 }}>
                Discord ingestion is designed and ready for backend implementation. Template format and parsing pipeline are defined in the architecture doc.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
