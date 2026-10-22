"use client";

// A pretend phone for the Text to Give demo. The member texts the church's
// number, picks a fund, and sends an amount; the gift is then recorded under
// their account with the method "Text". No real text message is sent.
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { recordTextGift } from "./actions";

const FUND_CHOICES = { 1: "tithe", 2: "offering", 3: "building" };
const MENU = "Reply 1 for Tithe, 2 for Offering, 3 for Building Fund.";

export default function TextToGive({ church, firstName }) {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState("start"); // start -> fund -> amount -> done
  const [fund, setFund] = useState(null);
  const [draft, setDraft] = useState("");
  const [isSending, startSending] = useTransition();
  const thread = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight });
  }, [messages]);

  const say = (from, text) => setMessages((list) => [...list, { from, text }]);

  function reply(text) {
    const answer = text.trim();

    if (step === "start" || step === "done") {
      if (answer.toUpperCase() === church.textKeyword) {
        setStep("fund");
        say("church", `Hi${firstName ? ` ${firstName}` : ""}! Thank you for giving to ${church.name}. ${MENU}`);
      } else {
        say("church", `Text ${church.textKeyword} to start a gift.`);
      }
      return;
    }

    if (step === "fund") {
      const choice = FUND_CHOICES[answer];
      if (!choice) {
        say("church", `Sorry, please reply 1, 2, or 3. ${MENU}`);
        return;
      }
      setFund(choice);
      setStep("amount");
      say("church", "How much?");
      return;
    }

    if (step === "amount") {
      const amount = Number(answer.replace(/[$,\s]/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) {
        say("church", "Please reply with an amount, like 25 or 25.50.");
        return;
      }
      startSending(async () => {
        const result = await recordTextGift({ fund, amount });
        if (result.error) {
          say("church", result.error);
          return;
        }
        setStep("done");
        say(
          "church",
          `Thank you${firstName ? `, ${firstName}` : ""}! Your ${result.amount} gift to ${result.fund} has been recorded. You'll see it on My Giving.`
        );
      });
    }
  }

  function send(event) {
    event.preventDefault();
    if (!draft.trim() || isSending) return;
    say("me", draft.trim());
    reply(draft);
    setDraft("");
  }

  function startOver() {
    setMessages([]);
    setStep("start");
    setFund(null);
  }

  return (
    <div className="ttg">
      <div className="phone" aria-label="Text to Give demo phone">
        <div className="phone-top">
          <span className="phone-notch" aria-hidden="true" />
          <span className="phone-contact">
            <strong>{church.name}</strong>
            <span>{church.textNumber}</span>
          </span>
        </div>

        <ol className="phone-thread" ref={thread} aria-live="polite">
          {messages.length === 0 && (
            <li className="phone-hint">
              Text <strong>{church.textKeyword}</strong> to {church.textNumber} to start.
            </li>
          )}
          {messages.map((m, i) => (
            <li key={i} className={`bubble bubble-${m.from}`}>
              <span className="visually-hidden">{m.from === "me" ? "You:" : "Church:"}</span>
              {m.text}
            </li>
          ))}
          {isSending && <li className="bubble bubble-church bubble-typing">Recording your gift…</li>}
        </ol>

        {firstName ? (
          <form className="phone-compose" onSubmit={send}>
            <label className="visually-hidden" htmlFor="ttg-message">
              Text message
            </label>
            <input
              id="ttg-message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={step === "start" ? `Type ${church.textKeyword}` : "Type a reply"}
              autoComplete="off"
              inputMode={step === "amount" ? "decimal" : step === "fund" ? "numeric" : "text"}
            />
            <button type="submit" disabled={!draft.trim() || isSending} aria-label="Send">
              ↑
            </button>
          </form>
        ) : (
          <p className="phone-login">
            <Link href="/login">Log in</Link> to try Text to Give. Gifts are recorded under your
            account.
          </p>
        )}
      </div>

      <div className="ttg-side">
        <p className="demo-note ttg-demo">Demo only: no real text message is sent.</p>
        {messages.length > 0 && (
          <button type="button" className="button button-small" onClick={startOver}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
