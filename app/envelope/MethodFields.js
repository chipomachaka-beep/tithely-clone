"use client";

// Cash or check choice. The check number box only appears for checks.
import { useState } from "react";

export default function MethodFields() {
  const [method, setMethod] = useState("cash");

  return (
    <>
      <fieldset className="segmented">
        <legend>Method</legend>
        <div className="segmented-options">
          {[
            { value: "cash", label: "Cash" },
            { value: "check", label: "Check" },
          ].map((option) => (
            <label key={option.value} className="segmented-option">
              <input
                type="radio"
                name="method"
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {method === "check" && (
        <label>
          Check number
          <input
            name="check_number"
            type="text"
            inputMode="numeric"
            required
            maxLength={20}
            pattern="[A-Za-z0-9\-]+"
            title="Letters, numbers, and dashes only"
            placeholder="e.g. 1042"
          />
        </label>
      )}
    </>
  );
}
