import { useState } from "react";

const PRIZES = [
  { key: "prize1", label: "1等", emoji: "🥇", color: "#e8a000", bg: "#fff8e6" },
  { key: "prize2", label: "2等", emoji: "🥈", color: "#666", bg: "#f5f5f5" },
  { key: "prize3", label: "3等", emoji: "🥉", color: "#a05a00", bg: "#fff3e8" },
  { key: "prize4", label: "4等", emoji: "🎖️", color: "#0077cc", bg: "#e8f4ff" },
  { key: "prize5", label: "5等", emoji: "🎗️", color: "#7c3aed", bg: "#f3eeff" },
];

const defaultForm = {
  name: "", total: "", remaining: "", costPerPull: "", minGuarantee: "", smallHitRate: "",
  prize1: "", prize2: "", prize3: "", prize4: "", prize5: "",
};

function calcStats(oripa) {
  const remaining = Number(oripa.remaining);
  const cost = Number(oripa.costPerPull);
  const minG = Number(oripa.minGuarantee) || 0;
  const smallRate = Number(oripa.smallHitRate);
  if (!remaining || !cost) return null;
  const netCost = cost - minG > 0 ? cost - minG : cost;
  const pSmall = smallRate > 0 ? 1 / smallRate : 0;
  const prizes = PRIZES.map(p => {
    const count = Number(oripa[p.key]) || 0;
    const prob = count > 0 ? count / remaining : 0;
    return { ...p, count, prob };
  });
  const p1 = prizes[0].prob;
  const expectedPulls = p1 > 0 ? 1 / p1 : Infinity;
  const expectedCost = expectedPulls * netCost;
  const score = p1 > 0 ? expectedCost : Infinity;
  return { prizes, pSmall, netCost, expectedPulls, expectedCost, score };
}

function PullSimulator({ oripa }) {
  const [budgetStr, setBudgetStr] = useState("5000");
  const stats = calcStats(oripa);
  if (!stats) return null;
  const budget = Number(budgetStr) || 0;
  const pulls = stats.netCost > 0 ? Math.floor(budget / stats.netCost) : 0;
  const activePrizes = stats.prizes.filter(p => p.count > 0);

  return (
    <div style={{ marginTop: 12, padding: "12px", background: "#fffbea", borderRadius: 10, border: "1px solid #ffe08a" }}>
      <div style={{ fontSize: 11, color: "#b07800", marginBottom: 8, fontWeight: 700 }}>💰 シミュレーター</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          type="number"
          value={budgetStr}
          onChange={e => setBudgetStr(e.target.value)}
          style={{ width: 90, padding: "5px 8px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#333", fontSize: 13 }}
        />
        <span style={{ color: "#888", fontSize: 13 }}>円 →</span>
        <span style={{ color: "#333", fontSize: 13, fontWeight: 700 }}>{pulls.toLocaleString()}回引ける</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {activePrizes.map(p => {
          const pTotal = pulls > 0 ? 1 - Math.pow(1 - p.prob, pulls) : 0;
          const pct = pTotal * 100;
          const nInN = pTotal > 0 ? Math.round(1 / pTotal) : null;
          return (
            <div key={p.key} style={{ background: p.bg, borderRadius: 8, padding: "8px 12px", border: `1px solid ${p.color}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.emoji} {p.label}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: pTotal > 0.5 ? "#16a34a" : pTotal > 0.1 ? "#d97706" : "#dc2626" }}>
                  {pct.toFixed(pct < 0.001 ? 4 : pct < 0.1 ? 2 : 1)}%
                </div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{nInN ? `${nInN.toLocaleString()}回に1回` : "—"}</div>
              </div>
            </div>
          );
        })}
        {stats.pSmall > 0 && (() => {
          const pSmallTotal = pulls > 0 ? 1 - Math.pow(1 - stats.pSmall, pulls) : 0;
          const nInN = pSmallTotal > 0 ? Math.round(1 / pSmallTotal) : null;
          return (
            <div style={{ background: "#f0fff4", borderRadius: 8, padding: "8px 12px", border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>⚡ 小当たり</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#16a34a" }}>
                  {(pSmallTotal * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{nInN ? `${nInN.toLocaleString()}回に1回` : "—"}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function Field({ label, hint, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#444", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>{hint}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#222", fontSize: 13, boxSizing: "border-box" }}
      />
    </div>
  );
}

function OripaForm({ initial = defaultForm, onSave, onCancel, isEdit = false }) {
  const [form, setForm] = useState({ ...defaultForm, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.total || !form.remaining || !form.costPerPull) return;
    onSave({ ...form, id: form.id || Date.now() });
  };

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>
        {isEdit ? "✏️ オリパを編集" : "オリパ情報を入力"}
      </div>
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 16 }}>サイトの詳細ページを見ながら入力してね</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <Field label="🎴 オリパ名" hint="比較しやすい名前をつけよう" value={form.name} onChange={v => set("name", v)} placeholder="例：超豪華オリパEX" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="📦 総口数" hint="全体の口数" value={form.total} onChange={v => set("total", v)} placeholder="例：10000" type="number" />
          <Field label="🔢 残り口数" hint="今現在残っている口数" value={form.remaining} onChange={v => set("remaining", v)} placeholder="例：8000" type="number" />
          <Field label="🪙 1回のコスト" hint="1回引くコイン数" value={form.costPerPull} onChange={v => set("costPerPull", v)} placeholder="例：6" type="number" />
          <Field label="🛡️ 最低保証" hint="ハズレでも必ずもらえる" value={form.minGuarantee} onChange={v => set("minGuarantee", v)} placeholder="例：2" type="number" />
        </div>
        <Field label="⚡ 小当たり（分母）" hint="「319分の1」なら 319" value={form.smallHitRate} onChange={v => set("smallHitRate", v)} placeholder="例：319" type="number" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#444", fontWeight: 700, marginBottom: 2 }}>🏅 各等の枚数</div>
        <div style={{ fontSize: 10, color: "#aaa", marginBottom: 10 }}>総口数のうち何枚入っているか（わかる分だけでOK）</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PRIZES.map(p => (
            <div key={p.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: form[p.key] ? p.bg : "#f9fafb",
              borderRadius: 10, padding: "10px 12px",
              border: `1.5px solid ${form[p.key] ? p.color + "44" : "#e5e7eb"}`,
            }}>
              <div style={{ fontSize: 13, color: p.color, fontWeight: 800, width: 36, flexShrink: 0 }}>{p.emoji} {p.label}</div>
              <input
                type="number" value={form[p.key]} onChange={e => set(p.key, e.target.value)} placeholder="枚数"
                style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e5e7eb", background: "#fff", color: "#222", fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>枚</span>
              {form[p.key] && form.remaining && (
                <div style={{ fontSize: 11, color: p.color, fontWeight: 700, flexShrink: 0, minWidth: 60, textAlign: "right" }}>
                  1/{Math.round(Number(form.remaining) / Number(form[p.key])).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={submit} style={{
          flex: 1, padding: "12px", borderRadius: 10,
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
        }}>{isEdit ? "✅ 保存する" : "追加して比較 →"}</button>
        <button onClick={onCancel} style={{
          padding: "12px 16px", borderRadius: 10, background: "#f3f4f6",
          border: "none", color: "#888", cursor: "pointer", fontSize: 13,
        }}>キャンセル</button>
      </div>
    </div>
  );
}

function OripaCard({ oripa, rank, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const stats = calcStats(oripa);
  const remaining = Number(oripa.remaining);
  const total = Number(oripa.total);
  const remainPct = total > 0 ? (remaining / total) * 100 : 100;
  const rankColors = [{ bg: "#fbbf24", text: "#7c2d00" }, { bg: "#9ca3af", text: "#fff" }, { bg: "#cd7c32", text: "#fff" }];
  const rc = rank <= 3 ? rankColors[rank - 1] : { bg: "#e5e7eb", text: "#6b7280" };

  if (editing) {
    return (
      <OripaForm
        initial={oripa}
        onSave={updated => { onEdit(updated); setEditing(false); }}
        onCancel={() => setEditing(false)}
        isEdit
      />
    );
  }

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${rank === 1 ? "#fbbf24" : "#e5e7eb"}`,
      borderRadius: 16, padding: 16, position: "relative",
      boxShadow: rank === 1 ? "0 4px 20px rgba(251,191,36,0.2)" : "0 2px 8px rgba(0,0,0,0.07)",
    }}>
      <div style={{
        position: "absolute", top: -12, left: 14,
        background: rc.bg, color: rc.text,
        fontWeight: 800, fontSize: 12, padding: "3px 12px", borderRadius: 20,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>{rank <= 3 ? `🏆 ${rank}位` : `${rank}位`}</div>

      {/* 編集・削除ボタン */}
      <div style={{ position: "absolute", top: 8, right: 10, display: "flex", gap: 4 }}>
        <button onClick={() => setEditing(true)} style={{
          background: "#f3f4f6", border: "none", color: "#666", cursor: "pointer",
          fontSize: 12, borderRadius: 6, padding: "3px 8px", fontWeight: 700,
        }}>✏️ 編集</button>
        <button onClick={onDelete} style={{
          background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 20, lineHeight: 1,
        }}>×</button>
      </div>

      <div style={{ marginTop: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>{oripa.name || "（名前なし）"}</div>
      </div>

      {/* 残り口数バー */}
      <div style={{ marginBottom: 14, background: "#f9fafb", borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 6 }}>
          <span>残り <b style={{ color: "#333" }}>{Number(remaining).toLocaleString()}</b> 口</span>
          <span>全 {Number(total).toLocaleString()} 口</span>
        </div>
        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${remainPct}%`,
            background: remainPct > 50 ? "#22c55e" : remainPct > 20 ? "#f59e0b" : "#ef4444",
            borderRadius: 4,
          }} />
        </div>
        <div style={{ fontSize: 10, color: "#aaa", marginTop: 4, textAlign: "right" }}>{remainPct.toFixed(1)}% 残り</div>
      </div>

      {/* 各等確率 */}
      {stats && stats.prizes.some(p => p.count > 0) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8, fontWeight: 600 }}>各等の当選確率（現在の残り口数）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {stats.prizes.map(p => {
              if (p.count === 0) return null;
              const barPct = Math.min(p.prob * 10000, 100);
              return (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 38, fontSize: 11, color: p.color, fontWeight: 700,
                    flexShrink: 0, background: p.bg, borderRadius: 6,
                    padding: "2px 4px", textAlign: "center",
                  }}>{p.emoji}{p.label}</div>
                  <div style={{ flex: 1, height: 5, background: "#f3f4f6", borderRadius: 3, overflow: "hidden", minWidth: 0 }}>
                    <div style={{ height: "100%", width: `${barPct}%`, background: p.color, borderRadius: 3, opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#555", flexShrink: 0, fontWeight: 600 }}>
                    1/{Math.round(1 / p.prob).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: "#bbb", flexShrink: 0, width: 28, textAlign: "right" }}>{p.count}枚</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* スタッツ */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>実質コスト/回</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>{stats.netCost}コイン</div>
          </div>
          <div style={{ background: "#fffbea", borderRadius: 8, padding: "8px 10px", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 10, color: "#b07800", marginBottom: 2 }}>1等までの期待費用</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>
              {stats.expectedCost < 1e9 ? `約${Math.round(stats.expectedCost / 10000)}万円` : "超高額"}
            </div>
          </div>
        </div>
      )}

      <PullSimulator oripa={oripa} />
    </div>
  );
}

function AddForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  if (!open) return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(true)} style={{
        width: "100%", padding: "14px", borderRadius: 12,
        background: "#fff", border: "2px dashed #d1d5db", color: "#9ca3af",
        fontSize: 15, cursor: "pointer", fontWeight: 600,
      }}>＋ オリパを追加する</button>
    </div>
  );
  return (
    <div style={{ marginBottom: 20 }}>
      <OripaForm
        onSave={o => { onAdd(o); setOpen(false); }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [oripas, setOripas] = useState([]);
  const sorted = [...oripas].sort((a, b) => {
    const sa = calcStats(a)?.score ?? Infinity;
    const sb = calcStats(b)?.score ?? Infinity;
    return sa - sb;
  });

  const editOripa = (updated) => setOripas(p => p.map(o => o.id === updated.id ? updated : o));

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fff8e6 0%, #f0f4ff 100%)",
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
      padding: "20px 14px", maxWidth: 480, margin: "0 auto",
      boxSizing: "border-box",
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#f59e0b", marginBottom: 6, fontWeight: 700 }}>ORIPA SIMULATOR</div>
        <h1 style={{
          fontSize: 24, fontWeight: 900, margin: 0,
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>オリパ確率シミュレーター</h1>
        <p style={{ color: "#aaa", fontSize: 12, marginTop: 6 }}>
          引く前に確率を知って、後悔しない選択を。
        </p>
      </div>

      <AddForm onAdd={o => setOripas(p => [...p, o])} />

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#ccc" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎴</div>
          <div style={{ fontSize: 14 }}>オリパを追加してください</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sorted.map((o, i) => (
            <OripaCard key={o.id} oripa={o} rank={i + 1}
              onDelete={() => setOripas(p => p.filter(x => x.id !== o.id))}
              onEdit={editOripa}
            />
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 28, color: "#ddd", fontSize: 10 }}>
        1等までの期待費用が低い順にランキング · コインレート1:1で計算
      </div>
    </div>
  );
}
