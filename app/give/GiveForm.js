"use client";

// The interactive part of the Give page: pick an amount, pick a fund, press Give.
// It runs in the browser so the buttons can highlight as you tap them.
import { useActionState, useEffect, useState } from "react";
import { give } from "./actions";
import { formatMoney } from "@/lib/format";

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

const FUNDS = [
  { value: "tithe", label: "Tithe", description: "Return a faithful tenth" },
  { value: "offering", label: "Offering", description: "Support church ministries" },
  { value: "building", label: "Building Fund", description: "Help build our future home" },
];

export default function GiveForm() {
  const [presetAmount, setPresetAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [fund, setFund] = useState("tithe");
  const [localDate, setLocalDate] = useState("");
  const [state, formAction, isSaving] = useActionState(give, { error: null });

  // Today's date on the giver's own device, as "2026-10-20".
  useEffect(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    setLocalDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  }, []);

  // A typed amount wins over the preset buttons.
  const amount = customAmount !== "" ? Number(customAmount) : presetAmount;
  const amountIsValid = Number.isFinite(amount) && amount > 0;

  return (
    <form action={formAction} className="give-form">
      <input type="hidden" name="amount" value={amountIsValid ? amount : ""} />
      <input type="hidden" name="fund" value={fund} />
      <input type="hidden" name="given_on" value={localDate} />

      <h2 className="give-step">1. Choose an amount</h2>
      <div className="amount-grid">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="amount-button"
            aria-pressed={customAmount === "" && presetAmount === preset}
            onClick={() => {
              setPresetAmount(preset);
              setCustomAmount("");
            }}
          >
            ${preset}
          </button>
        ))}
      </div>
      <label className="custom-amount">
        <span>Or enter another amount</span>
        <span className="custom-amount-field">
          <span className="dollar-sign">$</span>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </span>
      </label>

      <h2 className="give-step">2. Choose a fund</h2>
      <div className="fund-grid">
        {FUNDS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="fund-button"
            aria-pressed={fund === f.value}
            onClick={() => setFund(f.value)}
          >
            <span className="fund-button-label">{f.label}</span>
            <span className="fund-button-description">{f.description}</span>
          </button>
        ))}
      </div>

      {state.error && <p className="error">{state.error}</p>}

      <button
        type="submit"
        className="button button-gold give-submit"
        disabled={!amountIsValid || isSaving}
      >
        {isSaving
          ? "Giving..."
          : amountIsValid
            ? `Give ${formatMoney(amount)}`
            : "Give"}
      </button>
      <p className="demo-note">Demo only: no card is charged.</p>
    </form>
  );
}
