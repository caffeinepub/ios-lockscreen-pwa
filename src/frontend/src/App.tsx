import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
type ClockMode = "ios" | "android";
type TimeFormat = "12h" | "24h";
type FontOption = "sf" | "helvetica" | "roboto" | "georgia";
type TapPhase = 0 | 1 | 2;

interface Settings {
  mode: ClockMode;
  timeFormat: TimeFormat;
  font: FontOption;
  clockScale: number;
  backgroundImage: string | null;
}

interface ElementPositions {
  clock: { x: number; y: number };
  flashlight: { x: number; y: number };
  camera: { x: number; y: number };
}

const DEFAULT_POSITIONS: ElementPositions = {
  clock: { x: 50, y: 38 },
  flashlight: { x: 9, y: 87 },
  camera: { x: 91, y: 87 },
};

function loadPositions(): ElementPositions {
  try {
    const raw = localStorage.getItem("lockscreen-positions");
    if (raw) return { ...DEFAULT_POSITIONS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_POSITIONS };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDayName(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}
function getMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
function formatHours(d: Date, fmt: TimeFormat): string {
  if (fmt === "24h") return String(d.getHours()).padStart(2, "0");
  const h = d.getHours() % 12 || 12;
  return String(h).padStart(2, "0");
}
function formatMins(d: Date): string {
  return String(d.getMinutes()).padStart(2, "0");
}
function getZone(x: number, y: number, w: number, h: number): number {
  const col = Math.floor((x / w) * 3);
  const row = Math.floor((y / h) * 3);
  return row * 3 + col + 1;
}

const FONT_MAP: Record<FontOption, string> = {
  sf: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
  helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  roboto: "'Roboto', 'Google Sans', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
};

// ── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({
  settings,
  onUpdate,
  onClose,
  onResetState,
  onEditLayout,
}: {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
  onClose: () => void;
  onResetState: () => void;
  onEditLayout: () => void;
}) {
  const [showTutorial, setShowTutorial] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onUpdate({ backgroundImage: url });
    },
    [onUpdate],
  );

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };
  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.85)",
    fontSize: "16px",
    fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  };
  const subLabelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)",
    fontSize: "12px",
    marginTop: "2px",
    fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  };

  const Seg = ({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div
      style={{
        display: "flex",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "2px",
        gap: "2px",
      }}
    >
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
            fontWeight: value === o.value ? 600 : 400,
            background:
              value === o.value ? "rgba(255,255,255,0.85)" : "transparent",
            color: value === o.value ? "#000" : "rgba(255,255,255,0.6)",
            transition: "all 0.15s ease",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      data-ocid="settings.panel"
      aria-modal="true"
      aria-label="Settings"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(18,18,18,0.98)",
        borderRadius: "24px 24px 0 0",
        padding: "0 24px 40px",
        zIndex: 1000,
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Handle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "12px 0 8px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: "18px",
            fontWeight: 600,
            fontFamily:
              "-apple-system, 'SF Pro Display', system-ui, sans-serif",
          }}
        >
          Settings
        </span>
        <button
          type="button"
          data-ocid="settings.close_button"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            fontSize: "16px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="settings-scroll" style={{ flex: 1, paddingTop: 4 }}>
        {/* Edit Layout */}
        <div style={rowStyle}>
          <div>
            <div style={labelStyle}>Edit Layout</div>
            <div style={subLabelStyle}>Drag elements to reposition</div>
          </div>
          <button
            type="button"
            data-ocid="settings.edit_layout_button"
            onClick={() => {
              onEditLayout();
              onClose();
            }}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10,
              color: "white",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
            }}
          >
            Edit
          </button>
        </div>

        {/* Wallpaper */}
        <div
          style={{
            ...rowStyle,
            flexDirection: "column",
            alignItems: "stretch",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={labelStyle}>Wallpaper</div>
              <div style={subLabelStyle}>
                Choose a custom lockscreen background
              </div>
            </div>
            <button
              type="button"
              data-ocid="settings.upload_button"
              onClick={() => fileRef.current?.click()}
              style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 10,
                color: "white",
                fontSize: 13,
                cursor: "pointer",
                fontFamily:
                  "-apple-system, 'SF Pro Text', system-ui, sans-serif",
              }}
            >
              Choose
            </button>
          </div>
          {settings.backgroundImage && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundImage: `url(${settings.backgroundImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
              <button
                type="button"
                data-ocid="settings.delete_button"
                onClick={() => onUpdate({ backgroundImage: null })}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  background: "rgba(255,60,60,0.2)",
                  border: "1px solid rgba(255,60,60,0.25)",
                  borderRadius: 10,
                  color: "#ff6060",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily:
                    "-apple-system, 'SF Pro Text', system-ui, sans-serif",
                }}
              >
                Reset to Black
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Mode */}
        <div style={rowStyle}>
          <div style={labelStyle}>Display Mode</div>
          <div data-ocid="settings.toggle">
            <Seg
              options={[
                { label: "iOS", value: "ios" },
                { label: "Android", value: "android" },
              ]}
              value={settings.mode}
              onChange={(v) => onUpdate({ mode: v as ClockMode })}
            />
          </div>
        </div>

        {/* Time Format */}
        <div style={rowStyle}>
          <div style={labelStyle}>Time Format</div>
          <Seg
            options={[
              { label: "12h", value: "12h" },
              { label: "24h", value: "24h" },
            ]}
            value={settings.timeFormat}
            onChange={(v) => onUpdate({ timeFormat: v as TimeFormat })}
          />
        </div>

        {/* Font */}
        <div style={rowStyle}>
          <div style={labelStyle}>Clock Font</div>
          <select
            data-ocid="settings.select"
            value={settings.font}
            onChange={(e) => onUpdate({ font: e.target.value as FontOption })}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "white",
              padding: "8px 12px",
              fontSize: 14,
              fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="sf" style={{ background: "#1a1a1a" }}>
              SF Pro (iOS)
            </option>
            <option value="helvetica" style={{ background: "#1a1a1a" }}>
              Helvetica
            </option>
            <option value="roboto" style={{ background: "#1a1a1a" }}>
              Roboto
            </option>
            <option value="georgia" style={{ background: "#1a1a1a" }}>
              Georgia
            </option>
          </select>
        </div>

        {/* Clock Size */}
        <div
          style={{
            ...rowStyle,
            flexDirection: "column",
            alignItems: "stretch",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={labelStyle}>Clock Size</div>
            <div style={{ ...labelStyle, opacity: 0.6 }}>
              {Math.round(settings.clockScale * 100)}%
            </div>
          </div>
          <input
            type="range"
            min={0.7}
            max={1.5}
            step={0.05}
            value={settings.clockScale}
            onChange={(e) =>
              onUpdate({ clockScale: Number.parseFloat(e.target.value) })
            }
            style={{ width: "100%" }}
          />
        </div>

        {/* Tutorial */}
        <div
          style={{
            ...rowStyle,
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <button
            type="button"
            onClick={() => setShowTutorial((p) => !p)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              padding: 0,
            }}
          >
            <div style={labelStyle}>How It Works</div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              {showTutorial ? "▲" : "▼"}
            </span>
          </button>
          {showTutorial && (
            <div
              style={{
                marginTop: 12,
                padding: 16,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                color: "rgba(255,255,255,0.65)",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily:
                  "-apple-system, 'SF Pro Text', system-ui, sans-serif",
              }}
            >
              <p
                style={{
                  marginBottom: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                Hidden Grid Feature
              </p>
              <p style={{ marginBottom: 8 }}>
                The screen is divided into an invisible 3×3 grid (9 zones). Each
                zone corresponds to 1–9 minutes.
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>
                  1st tap:
                </strong>{" "}
                Select a zone (top-left = 1 min, bottom-right = 9 min). The
                clock immediately jumps forward by that many minutes + 40
                seconds.
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>
                  2nd tap:
                </strong>{" "}
                Triggers rewind mode. The clock freezes for 3 seconds, then
                smoothly rewinds back to real time.
              </p>
              <p>
                Perfect for casually glancing at a phone while establishing an
                alibi window. 😉
              </p>
            </div>
          )}
        </div>

        {/* Reset State */}
        <div style={{ ...rowStyle, borderBottom: "none", paddingBottom: 0 }}>
          <div>
            <div style={labelStyle}>Reset Clock State</div>
            <div style={subLabelStyle}>Return to real time immediately</div>
          </div>
          <button
            type="button"
            data-ocid="clock.reset_button"
            onClick={() => {
              onResetState();
              onClose();
            }}
            style={{
              padding: "8px 16px",
              background: "rgba(255,60,60,0.2)",
              border: "1px solid rgba(255,60,60,0.3)",
              borderRadius: 10,
              color: "#ff6060",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [displayHours, setDisplayHours] = useState("");
  const [displayMins, setDisplayMins] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [displayDay, setDisplayDay] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [positions, setPositions] = useState<ElementPositions>(loadPositions);
  const [dragTarget, setDragTarget] = useState<keyof ElementPositions | null>(
    null,
  );
  const [settings, setSettings] = useState<Settings>({
    mode: "ios",
    timeFormat: "12h",
    font: "sf",
    clockScale: 1.0,
    backgroundImage: null,
  });

  // RAF-loop refs
  const realTimeRef = useRef<Date>(new Date());
  const offsetMinutesRef = useRef(0);
  const isAdvancedRef = useRef(false);
  const rewindDelayActiveRef = useRef(false);
  const isRewindingRef = useRef(false);
  const tapCountRef = useRef<TapPhase>(0);
  const rewindStartTimeRef = useRef(0);
  const rewindDurationRef = useRef(0);
  const rewindFromRef = useRef(0);
  const lastSecondRef = useRef(-1);
  const rafRef = useRef<number>(0);
  const settingsRef = useRef(settings);
  const showSettingsRef = useRef(false);
  const cameraTapTimeRef = useRef(0);
  const isEditModeRef = useRef(false);

  // Drag refs
  const dragTargetRef = useRef<keyof ElementPositions | null>(null);
  const dragStartPointerRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const pendingRafRef = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    showSettingsRef.current = showSettings;
  }, [showSettings]);
  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  // Save positions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("lockscreen-positions", JSON.stringify(positions));
  }, [positions]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetState = useCallback(() => {
    tapCountRef.current = 0;
    offsetMinutesRef.current = 0;
    isAdvancedRef.current = false;
    rewindDelayActiveRef.current = false;
    isRewindingRef.current = false;
    lastSecondRef.current = -1;
  }, []);

  const resetLayout = useCallback(() => {
    setPositions({ ...DEFAULT_POSITIONS });
  }, []);

  // RAF loop
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      realTimeRef.current = now;
      let displayTime: Date;

      if (isRewindingRef.current) {
        const elapsed = performance.now() - rewindStartTimeRef.current;
        const progress = Math.min(elapsed / rewindDurationRef.current, 1);
        const rewindFromMs = rewindFromRef.current;
        const realMs = now.getTime();
        const currentMs = rewindFromMs - (rewindFromMs - realMs) * progress;
        displayTime = new Date(currentMs);
        if (progress >= 1) {
          isRewindingRef.current = false;
          tapCountRef.current = 0;
          isAdvancedRef.current = false;
          offsetMinutesRef.current = 0;
          displayTime = now;
        }
      } else if (rewindDelayActiveRef.current) {
        displayTime = new Date(
          now.getTime() + offsetMinutesRef.current * 60000 + 40000,
        );
      } else if (isAdvancedRef.current) {
        displayTime = new Date(
          now.getTime() + offsetMinutesRef.current * 60000 + 40000,
        );
      } else {
        displayTime = now;
      }

      const thisSecond = displayTime.getSeconds();
      if (thisSecond !== lastSecondRef.current) {
        lastSecondRef.current = thisSecond;
        const fmt = settingsRef.current.timeFormat;
        setDisplayHours(formatHours(displayTime, fmt));
        setDisplayMins(formatMins(displayTime));
        setDisplayDate(getMonthDay(displayTime));
        setDisplayDay(getDayName(displayTime));
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (key: keyof ElementPositions) => (e: React.PointerEvent) => {
      if (!isEditModeRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      dragTargetRef.current = key;
      dragStartPointerRef.current = { x: e.clientX, y: e.clientY };
      setPositions((prev) => {
        dragStartPosRef.current = { ...prev[key] };
        return prev;
      });
      setDragTarget(key);
    },
    [],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTargetRef.current) return;
    e.stopPropagation();

    const dx =
      ((e.clientX - dragStartPointerRef.current.x) / window.innerWidth) * 100;
    const dy =
      ((e.clientY - dragStartPointerRef.current.y) / window.innerHeight) * 100;

    const newX = Math.max(5, Math.min(95, dragStartPosRef.current.x + dx));
    const newY = Math.max(5, Math.min(95, dragStartPosRef.current.y + dy));

    if (pendingRafRef.current !== null) return;
    pendingRafRef.current = requestAnimationFrame(() => {
      pendingRafRef.current = null;
      const key = dragTargetRef.current;
      if (!key) return;
      setPositions((prev) => ({
        ...prev,
        [key]: { x: newX, y: newY },
      }));
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragTargetRef.current) return;
    e.stopPropagation();
    dragTargetRef.current = null;
    setDragTarget(null);
  }, []);

  const handleScreenTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (showSettingsRef.current) return;
      if (isEditModeRef.current) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-ignore-tap]")) return;

      let clientX: number;
      let clientY: number;
      if ("touches" in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const zone = getZone(clientX, clientY, w, h);
      const tc = tapCountRef.current;

      if (tc === 0) {
        offsetMinutesRef.current = zone;
        isAdvancedRef.current = true;
        tapCountRef.current = 1;
        lastSecondRef.current = -1;
      } else if (tc === 1) {
        tapCountRef.current = 2;
        rewindDelayActiveRef.current = true;
        setTimeout(() => {
          if (tapCountRef.current !== 2) return;
          rewindDelayActiveRef.current = false;
          const now = realTimeRef.current;
          const from = new Date(
            now.getTime() + offsetMinutesRef.current * 60000 + 40000,
          );
          rewindFromRef.current = from.getTime();
          rewindDurationRef.current = offsetMinutesRef.current * 1200;
          rewindStartTimeRef.current = performance.now();
          isRewindingRef.current = true;
          lastSecondRef.current = -1;
        }, 3000);
      }
    },
    [],
  );

  const handleCameraTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (isEditModeRef.current) return;
      const now = Date.now();
      const diff = now - cameraTapTimeRef.current;
      if (diff < 400) {
        setShowSettings(true);
        cameraTapTimeRef.current = 0;
      } else {
        cameraTapTimeRef.current = now;
      }
    },
    [],
  );

  const isIOS = settings.mode === "ios";
  const fontFamily = FONT_MAP[settings.font];

  const clockStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `clamp(${Math.round(100 * settings.clockScale)}px, ${Math.round(26 * settings.clockScale)}vw, ${Math.round(190 * settings.clockScale)}px)`,
    fontWeight: isIOS ? 700 : 300,
    letterSpacing: isIOS ? "-0.03em" : "0",
    lineHeight: 1,
    color: isIOS ? "#e8e8e8" : "#ffffff",
    textShadow: isIOS
      ? "0 0 40px rgba(255,255,255,0.15), 0 2px 20px rgba(0,0,0,0.5)"
      : "none",
    display: "flex",
    alignItems: "center",
    gap: "0.02em",
  };

  const dateStyle: React.CSSProperties = {
    fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    fontSize: "clamp(15px, 4vw, 20px)",
    fontWeight: 500,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: "0.01em",
  };

  const colonStyle: React.CSSProperties = {
    color: isIOS ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.7)",
    marginBottom: isIOS ? "0.05em" : "0.1em",
    fontSize: "0.9em",
  };

  const btnStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isEditMode ? "grab" : "pointer",
    pointerEvents: "auto",
    touchAction: "none",
    willChange: "transform",
    transition: dragTarget
      ? "none"
      : "box-shadow 0.2s ease, transform 0.2s ease",
  };

  const getDragStyle = (key: keyof ElementPositions): React.CSSProperties => {
    const isActive = dragTarget === key;
    return {
      boxShadow: isActive
        ? "0 0 0 3px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.4)"
        : isEditMode
          ? "0 0 0 1.5px rgba(255,255,255,0.35), 0 8px 32px rgba(0,0,0,0.4)"
          : "none",
      transform: isActive
        ? "translate(-50%, -50%) scale(1.08)"
        : "translate(-50%, -50%)",
    };
  };

  const clockPos = positions.clock;
  const flashPos = positions.flashlight;
  const cameraPos = positions.camera;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: settings.backgroundImage ? "transparent" : "#000000",
      }}
    >
      {/* Wallpaper */}
      {settings.backgroundImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${settings.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
          }}
        />
      )}
      {settings.backgroundImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 1,
          }}
        />
      )}

      {/* Grid overlay (edit mode only) */}
      {isEditMode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Touch / pointer area */}
      <div
        data-ocid="lockscreen.canvas_target"
        aria-label="Tap to interact"
        onClick={handleScreenTap}
        onTouchEnd={handleScreenTap}
        onPointerMove={isEditMode ? handlePointerMove : undefined}
        onPointerUp={isEditMode ? handlePointerUp : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            handleScreenTap(e as unknown as React.MouseEvent);
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 6,
          cursor: "default",
        }}
      />

      {/* Clock group — absolutely positioned */}
      <div
        data-ocid="lockscreen.clock.drag_handle"
        data-ignore-tap="true"
        onPointerDown={isEditMode ? handlePointerDown("clock") : undefined}
        onPointerMove={isEditMode ? handlePointerMove : undefined}
        onPointerUp={isEditMode ? handlePointerUp : undefined}
        style={{
          position: "absolute",
          left: `${clockPos.x}%`,
          top: `${clockPos.y}%`,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(6px, 1.5vw, 16px)",
          cursor: isEditMode
            ? dragTarget === "clock"
              ? "grabbing"
              : "grab"
            : "default",
          touchAction: "none",
          willChange: "transform",
          userSelect: "none",
          WebkitUserSelect: "none",
          ...getDragStyle("clock"),
          transform:
            dragTarget === "clock"
              ? "translate(-50%, -50%) scale(1.04)"
              : "translate(-50%, -50%)",
          transition: dragTarget === "clock" ? "none" : "box-shadow 0.2s ease",
        }}
      >
        {isIOS ? (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={dateStyle}>
                {displayDay}, {displayDate}
              </div>
            </div>
            <div style={clockStyle}>
              <span key={`h-${displayHours}`} className="digit-enter">
                {displayHours}
              </span>
              <span style={colonStyle}>:</span>
              <span key={`m-${displayMins}`} className="digit-enter">
                {displayMins}
              </span>
            </div>
          </>
        ) : (
          <>
            <div style={clockStyle}>
              <span key={`h-${displayHours}`} className="digit-enter">
                {displayHours}
              </span>
              <span style={colonStyle}>:</span>
              <span key={`m-${displayMins}`} className="digit-enter">
                {displayMins}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  ...dateStyle,
                  fontSize: "clamp(13px, 3.5vw, 18px)",
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {displayDay} · {displayDate}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Flashlight button — absolutely positioned */}
      <button
        type="button"
        data-ocid="lockscreen.flashlight.drag_handle"
        data-ignore-tap="true"
        aria-label="Flashlight"
        onPointerDown={isEditMode ? handlePointerDown("flashlight") : undefined}
        onPointerMove={isEditMode ? handlePointerMove : undefined}
        onPointerUp={isEditMode ? handlePointerUp : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...btnStyle,
          position: "absolute",
          left: `${flashPos.x}%`,
          top: `${flashPos.y}%`,
          zIndex: 10,
          ...getDragStyle("flashlight"),
          cursor: isEditMode
            ? dragTarget === "flashlight"
              ? "grabbing"
              : "grab"
            : "pointer",
          transition:
            dragTarget === "flashlight"
              ? "none"
              : "box-shadow 0.2s ease, transform 0.2s ease",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden="true"
        >
          <title>Flashlight</title>
          {/* Light rays */}
          <line
            x1="12"
            y1="1"
            x2="12"
            y2="3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="7.8"
            y1="2.8"
            x2="9"
            y2="4.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="16.2"
            y1="2.8"
            x2="15"
            y2="4.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Flashlight head (trapezoid) */}
          <path d="M8.5 5 L15.5 5 L14.5 10 L9.5 10 Z" />
          {/* Flashlight body */}
          <rect x="9.5" y="10" width="5" height="8" rx="0.5" />
          {/* Grip ridges */}
          <rect x="9.5" y="18" width="5" height="1.5" rx="0.5" opacity="0.7" />
          <rect x="10" y="19.5" width="4" height="1" rx="0.5" opacity="0.5" />
        </svg>
      </button>

      {/* Camera button — absolutely positioned */}
      <button
        type="button"
        data-ocid="lockscreen.camera.drag_handle"
        data-ignore-tap="true"
        aria-label="Camera"
        onPointerDown={isEditMode ? handlePointerDown("camera") : undefined}
        onPointerMove={isEditMode ? handlePointerMove : undefined}
        onPointerUp={isEditMode ? handlePointerUp : undefined}
        onClick={handleCameraTap}
        onTouchEnd={handleCameraTap}
        style={{
          ...btnStyle,
          position: "absolute",
          left: `${cameraPos.x}%`,
          top: `${cameraPos.y}%`,
          zIndex: 10,
          ...getDragStyle("camera"),
          cursor: isEditMode
            ? dragTarget === "camera"
              ? "grabbing"
              : "grab"
            : "pointer",
          transition:
            dragTarget === "camera"
              ? "none"
              : "box-shadow 0.2s ease, transform 0.2s ease",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <title>Camera</title>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {/* Home indicator (fixed, not draggable) */}
      <div
        style={{
          position: "fixed",
          bottom: "8px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 134,
            height: 5,
            background: "rgba(255,255,255,0.5)",
            borderRadius: 100,
          }}
        />
      </div>

      {/* Edit mode: Done button + hint */}
      {isEditMode && (
        <>
          <button
            type="button"
            data-ocid="edit.done_button"
            onClick={() => setIsEditMode(false)}
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              background: "white",
              color: "#000",
              border: "none",
              borderRadius: 20,
              padding: "10px 28px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
              letterSpacing: "0.01em",
            }}
          >
            Done
          </button>
          <button
            type="button"
            data-ocid="edit.delete_button"
            onClick={resetLayout}
            style={{
              position: "fixed",
              bottom: "56px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              background: "rgba(255,60,60,0.18)",
              color: "#ff8080",
              border: "1px solid rgba(255,60,60,0.3)",
              borderRadius: 16,
              padding: "8px 22px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            Reset Layout
          </button>
        </>
      )}

      {/* Settings backdrop */}
      {showSettings && (
        <div
          aria-label="Close settings"
          onClick={() => setShowSettings(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowSettings(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
          onResetState={resetState}
          onEditLayout={() => setIsEditMode(true)}
        />
      )}
    </div>
  );
}
