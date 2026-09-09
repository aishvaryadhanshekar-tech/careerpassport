import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { demoService } from "../demo/service";
import { completeAssessment } from "./service";
import { Field, Empty } from "./shared";
import type { Lever } from "./types";
import "./hiring.css";

function DemoCapture({
  lever,
  value,
  onChange,
}: {
  lever: Lever;
  value: string;
  onChange: (v: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "prep" | "recording" | "done">(
      "idle",
    ),
    [remaining, setRemaining] = useState(lever.prep || lever.seconds);
  useEffect(() => {
    if (!["prep", "recording"].includes(phase)) return;
    const timer = window.setInterval(
      () => setRemaining((v) => Math.max(0, v - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (remaining !== 0) return;
    if (phase === "prep") {
      setPhase("recording");
      setRemaining(lever.seconds);
    }
    if (phase === "recording") {
      setPhase("done");
      onChange("Simulated recording completed at time limit.");
    }
  }, [phase, remaining, lever.seconds, onChange]);
  const beat = lever.beats
    .filter((b) => b.at <= lever.seconds - remaining)
    .at(-1);
  return (
    <div className="hire-card">
      <p>
        Capture:{" "}
        {[
          lever.screen && "screen",
          lever.audio && "audio",
          lever.face && "face",
        ]
          .filter(Boolean)
          .join(" + ")}
      </p>
      <p className="hire-callout">
        Demo recording only. Your camera, microphone and screen are not
        captured.
      </p>
      <h3>
        {phase === "prep"
          ? "Research / preparation"
          : phase === "recording"
            ? "Simulated recording"
            : phase === "done"
              ? "Recording ready"
              : "Ready when you are"}{" "}
        · {remaining}s
      </h3>
      {phase === "recording" && <p>{beat?.text || lever.prompt}</p>}
      <div className="hire-actions">
        {phase === "idle" && (
          <button onClick={() => setPhase(lever.prep ? "prep" : "recording")}>
            Begin demo capture
          </button>
        )}
        {phase === "prep" && (
          <button
            onClick={() => {
              setPhase("recording");
              setRemaining(lever.seconds);
            }}
          >
            Start early
          </button>
        )}
        {phase === "recording" && (
          <button
            onClick={() => {
              setPhase("done");
              onChange("Simulated screen / video response recorded.");
            }}
          >
            Finish recording
          </button>
        )}
      </div>
      <Field
        label="Recording summary (demo response)"
        value={value}
        type="textarea"
        onChange={onChange}
      />
    </div>
  );
}
export function AssessmentExperience() {
  const { id = "", assessmentId = "", candidateId = "" } = useParams();
  const [, refresh] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  useEffect(() => demoService().subscribe(() => refresh((v) => v + 1)), []);
  const p = demoService().get(id),
    a = p?.operations?.assessments[assessmentId],
    invite = a?.invites[candidateId];
  function answer(key: string, value: string) {
    setAnswers((v) => ({ ...v, [key]: value }));
  }
  return (
    <main className="hire-candidate-page">
      <div className="hiring-workspace">
        {!p || !a?.publishedAt || !invite ? (
          <Empty>
            <h1>Invitation not available</h1>
            <p>Open this invitation in the browser where the demo was created, or ask the hiring team for a new link.</p>
          </Empty>
        ) : invite.completed ? (
          <div className="hire-brief">
            <h1>Assessment submitted.</h1>
            <p>
              Thank you, {p.candidates[candidateId]?.name}. The hiring team can
              now review your responses.
            </p>
          </div>
        ) : invite.expiresAt <= p.clock ? (
          <Empty>
            <h1>Invitation expired</h1>
            <p>Ask the hiring team to send a new invitation.</p>
          </Empty>
        ) : (
          <>
            <header className="hire-brief">
              <span>
                {a.role} · {a.levers.length} steps ·{" "}
                {Math.ceil(a.levers.reduce((n, l) => n + l.seconds, 0) / 60)}{" "}
                minutes
              </span>
              <h1>{a.title}</h1>
              <p>{a.storyline}</p>
              <small>
                Invited: {p.candidates[candidateId]?.name} · expires{" "}
                {new Date(invite.expiresAt).toLocaleString()}
              </small>
            </header>
            {a.levers.map((l, index) => (
              <section className="hire-lever" key={l.id}>
                <small>
                  STEP {index + 1} · {l.type} · {l.seconds}s
                </small>
                <h2>{l.title}</h2>
                <p className="hire-pre">{l.prompt}</p>
                {l.type === "Rapid Fire" &&
                  l.statements.map((s, i) => (
                    <fieldset className="hire-card" key={i}>
                      <legend>{s.text}</legend>
                      <div className="hire-actions">
                        {["SERIOUS", "JOKING"].map((value) => (
                          <label key={value}>
                            <input
                              type="radio"
                              name={`${l.id}:${i}`}
                              value={value}
                              checked={
                                answers[`${l.id}:statement:${i}`] === value
                              }
                              onChange={() =>
                                answer(`${l.id}:statement:${i}`, value)
                              }
                            />
                            {value}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                {l.type === "Pick & Defend" && (
                  <>
                    <p>{l.constraint}</p>
                    {l.resources.length > 0 && (
                      <p className="hire-muted">
                        Demo resource filenames: {l.resources.join(", ")}
                      </p>
                    )}
                    <fieldset className="hire-card">
                      <legend>Choose an approach</legend>
                      {l.options.map((o, i) => (
                        <label className="hire-list-row" key={i}>
                          <input
                            type="radio"
                            name={`${l.id}:option`}
                            checked={answers[`${l.id}:option`] === String(i)}
                            onChange={() => answer(`${l.id}:option`, String(i))}
                          />
                          <span>
                            <strong>{o.title}</strong>
                            <br />
                            {o.rationale}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    {l.defense.map((q, i) => (
                      <Field
                        key={i}
                        label={q}
                        type="textarea"
                        value={answers[`${l.id}:defense:${i}`] || ""}
                        onChange={(v) => answer(`${l.id}:defense:${i}`, v)}
                      />
                    ))}
                  </>
                )}
                {l.type === "Demo" && (
                  <>
                    <DemoCapture
                      lever={l}
                      value={answers[`${l.id}:recording`] || ""}
                      onChange={(v) => answer(`${l.id}:recording`, v)}
                    />
                    {l.upload && (
                      <label className="hire-field">
                        {l.uploadLabel}
                        <small>
                          {l.uploadInstructions} · {l.formats.join(", ")} ·
                          filename only in demo
                        </small>
                        <input
                          type="file"
                          onChange={(e) =>
                            answer(
                              `${l.id}:file`,
                              e.target.files?.[0]?.name || "",
                            )
                          }
                        />
                      </label>
                    )}
                  </>
                )}
              </section>
            ))}
            {error && (
              <div className="hire-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="funnel-primary"
              onClick={() => {
                try {
                  completeAssessment(id, assessmentId, candidateId, answers);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Submit assessment
            </button>
          </>
        )}
      </div>
    </main>
  );
}
