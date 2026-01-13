import React from "react";

export function PhoneFrame(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="page">
      <div className="topbar">
        <div className="topbarTitle">{props.title}</div>
      </div>
      <div className="phoneWrap">
        <div className="phone">
          <div className="phoneInner">{props.children}</div>
        </div>
      </div>
    </div>
  );
}

export function Card(props: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${props.className ?? ""}`}>{props.children}</div>;
}

export function Row(props: { children: React.ReactNode; className?: string }) {
  return <div className={`row ${props.className ?? ""}`}>{props.children}</div>;
}

export function Pill(props: { text: string; tone?: "ok" | "warn" | "muted" }) {
  const tone = props.tone ?? "muted";
  return <span className={`pill pill_${tone}`}>{props.text}</span>;
}

export function Button(props: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const v = props.variant ?? "ghost";
  return (
    <button className={`btn btn_${v}`} onClick={props.onClick} disabled={props.disabled}>
      {props.label}
    </button>
  );
}

export function Toggle(props: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`toggle ${props.value ? "toggle_on" : ""}`}
      onClick={() => props.onChange(!props.value)}
      type="button"
    >
      <span className="toggleDot" />
      <span className="toggleLabel">{props.label}</span>
    </button>
  );
}

export function TextInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <div className="fieldLabel">{props.label}</div>
      <input
        className="input"
        value={props.value}
        placeholder={props.placeholder ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const step = props.step ?? 1;
  return (
    <label className="field">
      <div className="fieldTop">
        <div className="fieldLabel">{props.label}</div>
        <div className="fieldValue">{props.value}</div>
      </div>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Segmented(props: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <div className="fieldLabel">{props.label}</div>
      <div className="seg">
        {props.options.map((o) => (
          <button
            key={o.key}
            className={`segBtn ${props.value === o.key ? "segBtn_on" : ""}`}
            onClick={() => props.onChange(o.key)}
            type="button"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Modal(props: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modalBack" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modalTop">
          <div className="modalTitle">{props.title}</div>
          <button className="iconBtn" onClick={props.onClose} type="button">
            ×
          </button>
        </div>
        <div className="modalBody">{props.body}</div>
      </div>
    </div>
  );
}
