import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clamp } from "../geometry.js";

export function Button({ children, onClick, disabled, active, danger, primary, ghost, title, className = "", iconOnly }) {
  const classes = [
    "btn",
    primary && "btn-primary",
    danger && "btn-danger",
    ghost && "btn-ghost",
    active && "is-active",
    iconOnly && "btn-icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled} title={title} aria-label={title}>
      {children}
    </button>
  );
}

/** Styled wrapper around a hidden file input. */
export function FileButton({ children, onFile, accept = "image/*", primary, className = "", title }) {
  const inputRef = useRef(null);
  return (
    <>
      <Button
        primary={primary}
        className={className}
        title={title}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
          }
        }}
      >
        {children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </>
  );
}

export function Card({ title, icon, collapsed, onToggle, children, badge }) {
  return (
    <section className="card">
      <button className="card-header" type="button" onClick={onToggle} aria-expanded={!collapsed}>
        <span className="card-title">
          {icon}
          {title}
          {badge != null && <span className="card-badge">{badge}</span>}
        </span>
        <ChevronDown size={17} className={collapsed ? "chevron" : "chevron open"} />
      </button>
      {!collapsed && <div className="card-body">{children}</div>}
    </section>
  );
}

export function Field({ label, children, htmlFor }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

/**
 * Numeric input that tolerates intermediate states while typing ("", "-",
 * "3,") instead of snapping to 0, and only commits finite values.
 */
export function NumberField({ value, onCommit, min = 0, max = 100000, step = 1, id, disabled }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const parse = (raw) => {
    const num = Number(String(raw).replace(",", "."));
    return Number.isFinite(num) ? clamp(num, min, max) : null;
  };

  return (
    <input
      id={id}
      className="input"
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={text}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = parse(e.target.value);
        if (parsed !== null && e.target.value.trim() !== "") onCommit(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parse(text);
        setText(String(parsed !== null && text.trim() !== "" ? parsed : value));
        if (parsed !== null && text.trim() !== "" && parsed !== value) onCommit(parsed);
      }}
    />
  );
}

export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type === "error" ? "toast-error" : ""}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, closeLabel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <Button ghost iconOnly title={closeLabel} onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
