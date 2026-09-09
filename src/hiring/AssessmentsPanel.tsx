import { LibraryFilters } from "../canvasJob/LibraryFilters";
import { useEffect, useState } from "react";
import { toBoard } from "../demo/service";
import { useDictation } from "../shared/useDictation";
import { newLever } from "./catalog";
import { change, inviteAssessment, publishAssessment } from "./service";
import { Field, Tabs, Empty, copy, type PanelProps } from "./shared";
import type { Assessment, Lever } from "./types";

const types: Lever["type"][] = ["Rapid Fire", "Pick & Defend", "Demo"];
export function generateLevers(a: Assessment): Lever[] {
  return a.levers.map((l) => ({
    ...l,
    prompt: `${a.instructions || a.storyline || "Improve a customer workflow with incomplete information."}\nYour role: ${a.role || "the new hire"}. ${l.type === "Rapid Fire" ? "Decide whether each statement is serious or joking." : l.type === "Pick & Defend" ? "Choose an approach and defend its trade-offs." : "Show your approach and explain your decisions."}`,
    constraint: "Work within the existing team and a two-week delivery window.",
    statements: Array.from({ length: l.questions }, (_, i) => ({
      text:
        i % 2
          ? `Ship option ${i + 1} without speaking to any users or checking results.`
          : `For decision ${i + 1}, validate the riskiest assumption before committing the team.`,
      answer: i % 2 ? ("JOKING" as const) : ("SERIOUS" as const),
    })),
    options: [
      "Validate first",
      "Ship a small experiment",
      "Rebuild the workflow",
      "Collect more data",
    ].map((title) => ({
      title,
      rationale: `Explain when “${title}” is the right trade-off.`,
    })),
    defense: Array.from(
      { length: l.questions },
      (_, i) =>
        [
          "What assumption matters most?",
          "What would change your decision?",
          "How will you measure the outcome?",
        ][i % 3],
    ),
    preferred: 1,
    why: "A small experiment provides useful evidence while limiting irreversible investment.",
    axis: "Speed versus confidence",
    beats: Array.from({ length: l.questions }, (_, i) => ({
      at: Math.floor((i * l.seconds) / l.questions),
      text: [
        "Frame the problem and assumptions",
        "Demonstrate your approach",
        "Explain trade-offs and next steps",
      ][i % 3],
    })),
    expected: "Clear framing\nPractical demonstration\nExplicit trade-offs",
    rubric:
      "Problem framing: names the user and constraint\nJudgment: explains alternatives\nValidation: names a measurable outcome",
  }));
}
export function AssessmentsPanel({ jobId, project, ops, run, focusId, startOnMount, embedded, onExit }: PanelProps & {
  /** When set (by the unified Trips library, TRP-01), open straight to this assessment's editor instead of this panel's own library. */
  focusId?: string;
  /** Open straight into a new-assessment draft, bypassing this panel's own library (used by the canonical Create control). */
  startOnMount?: boolean;
  /** True when hosted inside the unified Trips library — hides this panel's own library/create UI, which is now redundant. */
  embedded?: boolean;
  /** Called instead of the local "back to library" reset when embedded, so the caller can return to the unified library. */
  onExit?: () => void;
}) {
  const [libraryQuery,setLibraryQuery]=useState('');
  const [libraryStatus,setLibraryStatus]=useState('');
  const [libraryType,setLibraryType]=useState('');
  const library=Object.values(ops.assessments).filter(t=>t.title.toLowerCase().includes(libraryQuery.trim().toLowerCase())&&(!libraryStatus||(t.publishedAt?'published':'draft')===libraryStatus)&&(!libraryType||t.levers.some(l=>l.type===libraryType)));
  const [active, setActive] = useState<string | null>(null),
    [draft, setDraft] = useState<Assessment | null>(null),
    [tab, setTab] = useState("Edit");
  const [roster, setRoster] = useState<string[]>([]),
    [expiry, setExpiry] = useState(
      new Date(
        project.clock + 7 * 86400000 - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16),
    );
  const current = active ? ops.assessments[active] : undefined;
  const a = current?.publishedAt ? current : draft;
  const speech = useDictation({
    value: draft?.instructions || "",
    onChange: (instructions) =>
      setDraft((d) => (d ? { ...d, instructions } : d)),
  });
  // TRP-01: when the unified Trips library opens a specific component trip, or asks for a
  // brand-new one, jump straight to this panel's existing editor instead of its own library.
  useEffect(() => {
    if (!focusId) return;
    const target = ops.assessments[focusId];
    if (!target || active === focusId) return;
    setActive(focusId);
    setDraft(structuredClone(target));
    setRoster([]);
    setTab(target.publishedAt ? "Assign" : "Edit");
    // Only re-run when the caller points at a different record; `ops` changes on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);
  useEffect(() => {
    if (startOnMount) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function exitToLibrary() {
    if (onExit) onExit();
    else {
      setActive(null);
      setDraft(null);
    }
  }
  function start() {
    const a: Assessment = {
      id: crypto.randomUUID(),
      title: "New trip",
      stage: "",
      difficulty: "Intermediate",
      storyline: "",
      instructions: "",
      domain: project.configuration.draft.fields.industryType.value,
      role: project.configuration.draft.fields.designation.value,
      source: "Role brief",
      persona: "Candidate",
      levers: types.map(newLever),
      version: 1,
      roster: [],
      expiresAt: project.clock + 7 * 86400000,
      invites: {},
    };
    setDraft(a);
    setActive(a.id);
    setTab("Edit");
  }
  function patch(value: Partial<Assessment>) {
    setDraft((d) => (d ? { ...d, ...value } : d));
  }
  function lever(id: string, value: Partial<Lever>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            levers: d.levers.map((l) => (l.id === id ? { ...l, ...value } : l)),
          }
        : d,
    );
  }
  function save(publish = false) {
    if (!draft) return;
    run(
      () => {
        change(jobId, `Saved trip draft: ${draft.title}`, (o) => {
          if (o.assessments[draft.id]?.publishedAt)
            throw new Error(
              "Published content is immutable. Duplicate to revise.",
            );
          o.assessments[draft.id] = draft;
        });
        if (publish) publishAssessment(jobId, draft.id);
      },
      publish
        ? "Trip published. Choose candidates to invite."
        : "Trip draft saved.",
    );
  }
  function reorder(i: number, offset: number) {
    if (!draft) return;
    const levers = [...draft.levers],
      next = i + offset;
    if (!levers[next]) return;
    [levers[i], levers[next]] = [levers[next], levers[i]];
    patch({ levers });
  }
  const eligible = a
    ? Object.values(project.candidates).filter(
        (c) => c.stageId === a.stage && !a.invites[c.id]?.completed,
      )
    : [];
  return (
    <>
      {!embedded && (
        <>
          <div className="pipeline-library-header"><h3>Trip components &amp; responses</h3>{a&&<button onClick={exitToLibrary}>← Component library</button>}</div>
          <button className="funnel-primary" onClick={start}>
            ＋ Generate AI trip
          </button>
          {!a&&<><LibraryFilters query={libraryQuery} onQuery={setLibraryQuery} status={libraryStatus} onStatus={setLibraryStatus} types={types} type={libraryType} onType={setLibraryType} label="component trips"/>
          {!library.length&&<Empty>No trips match. Change the filters or create a trip.</Empty>}
          <div className="hire-library">
            {library.map((t) => (
              <button
                className={active === t.id ? "is-active" : ""}
                key={t.id}
                onClick={() => {
                  setActive(t.id);
                  setDraft(structuredClone(t));
                  setRoster([]);
                  setTab(t.publishedAt ? "Assign" : "Edit");
                }}
              >
                <strong>{t.title}</strong>
                <small>
                  {t.publishedAt ? "Published · view only" : "Draft"} ·{" "}
                  {t.stage || "No target stage"} · v{t.version}
                </small>
              </button>
            ))}
          </div></>}
        </>
      )}
      {embedded && a && (
        <div className="pipeline-trip-header pipeline-trip-header-editor">
          <button type="button" className="pipeline-trip-back" onClick={exitToLibrary}>← Trip library</button>
          <div className="pipeline-trip-title-row"><h3>{a.title || "Untitled trip"}</h3><span className="hire-pill">{a.publishedAt ? "Published" : "Draft"}</span></div>
        </div>
      )}
      {a && (
        <>
          <div className="hire-section-head">
            <h2>{a.title}</h2>
            <span className="hire-pill">
              {a.publishedAt ? "Published · VIEW ONLY" : "Draft"}
            </span>
          </div>
          <Tabs
            values={
              a.publishedAt
                ? ["Preview", "Assign", "Responses"]
                : ["Edit", "Preview"]
            }
            active={tab}
            onChange={setTab}
          />
          {!a.publishedAt && tab === "Edit" && (
            <>
              <div className="hire-form-grid">
                <Field
                  label="Trip title"
                  value={a.title}
                  onChange={(title) => patch({ title })}
                />
                <label className="hire-field">
                  Pipeline target stage
                  <select
                    aria-label="Trip target stage"
                    value={a.stage}
                    onChange={(e) => patch({ stage: e.target.value })}
                  >
                    <option value="">Select a stage</option>
                    {toBoard(project).stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Difficulty"
                  value={a.difficulty}
                  options={["Intermediate", "Advanced"]}
                  onChange={(difficulty) => patch({ difficulty })}
                />
                <Field
                  label="Storyline"
                  value={a.storyline}
                  onChange={(storyline) => patch({ storyline })}
                />
              </div>
              <button
                onClick={() =>
                  patch({
                    storyline: `A ${a.role || "new team member"} must improve a workflow in ${a.domain || "a growing product company"} under a two-week deadline.`,
                  })
                }
              >
                Suggest demo storyline
              </button>
              <Field
                label="Instructions"
                value={a.instructions}
                type="textarea"
                onChange={(instructions) => patch({ instructions })}
              />
              <button
                onClick={() =>
                  speech.recording
                    ? speech.stopRecording()
                    : void speech.startRecording()
                }
              >
                {speech.recording ? "Stop dictation" : "Dictate instructions"}
              </button>
              {(speech.micBlocked ||
                speech.micFailed ||
                speech.noSpeechApi) && (
                <p>Dictation unavailable. Type instructions instead.</p>
              )}
              <div className="hire-form-grid">
                {(["domain", "role", "source", "persona"] as const).map((k) => (
                  <Field
                    key={k}
                    label={`Spine · ${k}`}
                    value={a[k]}
                    onChange={(v) => patch({ [k]: v })}
                  />
                ))}
              </div>
              <h3>Trip components</h3>
              {a.levers.map((l, i) => (
                <article className="hire-card" key={l.id}>
                  <div className="hire-section-head">
                    <h3>
                      {l.type} · slot {i + 1}
                    </h3>
                    <div className="hire-actions">
                      <button
                        disabled={i === 0}
                        aria-label={`Move slot ${i + 1} up`}
                        onClick={() => reorder(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        disabled={i === a.levers.length - 1}
                        aria-label={`Move slot ${i + 1} down`}
                        onClick={() => reorder(i, 1)}
                      >
                        ↓
                      </button>
                      <button
                        aria-label={`Remove slot ${i + 1}`}
                        onClick={() =>
                          patch({
                            levers: a.levers.filter((x) => x.id !== l.id),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="hire-form-grid">
                    <Field
                      label="Time cap (seconds)"
                      type="number"
                      value={String(l.seconds)}
                      onChange={(v) =>
                        lever(l.id, { seconds: Math.max(1, Number(v)) })
                      }
                    />
                    <Field
                      label={`Questions → ${l.type === "Rapid Fire" ? "statements" : l.type === "Pick & Defend" ? "defense questions" : "teleprompter beats"}`}
                      type="number"
                      value={String(l.questions)}
                      onChange={(v) =>
                        lever(l.id, {
                          questions: Math.max(
                            1,
                            Math.min(100, Math.floor(Number(v))),
                          ),
                        })
                      }
                    />
                    <Field
                      label="Difficulty override"
                      value={l.difficulty}
                      options={["Use trip default", "Intermediate", "Advanced"]}
                      onChange={(difficulty) => lever(l.id, { difficulty })}
                    />
                  </div>
                </article>
              ))}
              <div className="hire-actions">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      patch({ levers: [...a.levers, newLever(t)] })
                    }
                  >
                    ＋ {t}
                  </button>
                ))}
                <button
                  onClick={() =>
                    run(
                      () =>
                        change(
                          jobId,
                          "Saved component template",
                          (o) => {
                            o.leverTemplates[a.title] = a.levers.map((l) => ({
                              ...newLever(l.type),
                              seconds: l.seconds,
                              questions: l.questions,
                              difficulty: l.difficulty,
                            }));
                          },
                        ),
                      "Slot configuration saved, without generated content.",
                    )
                  }
                >
                  Save as template
                </button>
                <select
                  aria-label="Saved lever configurations"
                  value=""
                  onChange={(e) => {
                    if (ops.leverTemplates[e.target.value])
                      patch({
                        levers: ops.leverTemplates[e.target.value].map((l) => ({
                          ...l,
                          id: crypto.randomUUID(),
                        })),
                      });
                  }}
                >
                  <option value="">Load slot template</option>
                  {Object.keys(ops.leverTemplates).map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
              <button
                className="funnel-primary"
                onClick={() => {
                  patch({ levers: generateLevers(a) });
                  setTab("Preview");
                }}
              >
                Generate trip components
              </button>
              <p className="hire-muted">
                Template-generated demo · no live AI.
              </p>
            </>
          )}
          {tab === "Preview" && (
            <>
              {a.levers.map((l) => (
                <fieldset
                  className="hire-lever"
                  disabled={Boolean(a.publishedAt)}
                  key={l.id}
                >
                  <legend>
                    {l.type}
                    {a.publishedAt ? " · VIEW ONLY" : ""}
                  </legend>
                  <div className="hire-form-grid">
                    <Field
                      label="Step title"
                      value={l.title}
                      onChange={(title) => lever(l.id, { title })}
                    />
                    <Field
                      label="Timer (seconds)"
                      type="number"
                      value={String(l.seconds)}
                      onChange={(v) =>
                        lever(l.id, { seconds: Math.max(1, Number(v)) })
                      }
                    />
                  </div>
                  <Field
                    label={
                      l.type === "Rapid Fire"
                        ? "Intro line"
                        : l.type === "Pick & Defend"
                          ? "Brief"
                          : "Demo cue"
                    }
                    value={l.prompt}
                    type="textarea"
                    onChange={(prompt) => lever(l.id, { prompt })}
                  />
                  {l.type === "Rapid Fire" && (
                    <>
                      {l.statements.map((s, i) => (
                        <div className="hire-condition" key={i}>
                          <Field
                            label={`Statement ${i + 1}`}
                            value={s.text}
                            onChange={(text) =>
                              lever(l.id, {
                                statements: l.statements.map((v, j) =>
                                  i === j ? { ...v, text } : v,
                                ),
                              })
                            }
                          />
                          <Field
                            label="Hidden answer key"
                            value={s.answer}
                            options={["SERIOUS", "JOKING"]}
                            onChange={(answer) =>
                              lever(l.id, {
                                statements: l.statements.map((v, j) =>
                                  i === j
                                    ? {
                                        ...v,
                                        answer: answer as "SERIOUS" | "JOKING",
                                      }
                                    : v,
                                ),
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              lever(l.id, {
                                statements: l.statements.filter(
                                  (_, j) => i !== j,
                                ),
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {!a.publishedAt && (
                        <button
                          onClick={() =>
                            lever(l.id, {
                              statements: [
                                ...l.statements,
                                { text: "", answer: "SERIOUS" },
                              ],
                            })
                          }
                        >
                          ＋ Statement
                        </button>
                      )}
                    </>
                  )}
                  {l.type === "Pick & Defend" && (
                    <>
                      <Field
                        label="Constraint"
                        value={l.constraint}
                        onChange={(constraint) => lever(l.id, { constraint })}
                      />
                      <div className="hire-actions">
                        <button
                          onClick={() => {
                            if ("speechSynthesis" in window)
                              speechSynthesis.speak(
                                new SpeechSynthesisUtterance(l.prompt),
                              );
                          }}
                        >
                          Preview browser voice
                        </button>
                        <label className="hire-field">
                          Recorded voice override
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) =>
                              lever(l.id, {
                                voice: e.target.files?.[0]?.name || "",
                              })
                            }
                          />
                        </label>
                      </div>
                      {l.voice && <small>Demo voice metadata: {l.voice}</small>}
                      <label className="hire-field">
                        Resources · files / images
                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            lever(l.id, {
                              resources: [
                                ...l.resources,
                                ...Array.from(
                                  e.target.files ?? [],
                                  (f) => f.name,
                                ),
                              ],
                            })
                          }
                        />
                      </label>
                      <p>{l.resources.join(", ")}</p>
                      {l.options.map((o, i) => (
                        <div className="hire-card" key={i}>
                          <Field
                            label={`Option ${i + 1}`}
                            value={o.title}
                            onChange={(title) =>
                              lever(l.id, {
                                options: l.options.map((v, j) =>
                                  j === i ? { ...v, title } : v,
                                ),
                              })
                            }
                          />
                          <Field
                            label="Rationale"
                            value={o.rationale}
                            onChange={(rationale) =>
                              lever(l.id, {
                                options: l.options.map((v, j) =>
                                  j === i ? { ...v, rationale } : v,
                                ),
                              })
                            }
                          />
                          <button
                            disabled={l.options.length <= 2}
                            onClick={() =>
                              lever(l.id, {
                                options: l.options.filter((_, j) => j !== i),
                                preferred: 0,
                              })
                            }
                          >
                            Remove option
                          </button>
                        </div>
                      ))}
                      {!a.publishedAt && (
                        <button
                          onClick={() =>
                            lever(l.id, {
                              options: [
                                ...l.options,
                                { title: "", rationale: "" },
                              ],
                            })
                          }
                        >
                          ＋ Option
                        </button>
                      )}
                      <Field
                        label="Defense questions · one per line"
                        type="textarea"
                        value={l.defense.join("\n")}
                        onChange={(v) =>
                          lever(l.id, { defense: v.split("\n") })
                        }
                      />
                      <details>
                        <summary>Hidden answer key</summary>
                        <label className="hire-field">
                          Preferred option
                          <select
                            value={l.preferred}
                            onChange={(e) =>
                              lever(l.id, { preferred: Number(e.target.value) })
                            }
                          >
                            {l.options.map((o, i) => (
                              <option key={i} value={i}>
                                {i + 1}. {o.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Field
                          label="Why"
                          value={l.why}
                          type="textarea"
                          onChange={(why) => lever(l.id, { why })}
                        />
                        <Field
                          label="Trade-off axis"
                          value={l.axis}
                          onChange={(axis) => lever(l.id, { axis })}
                        />
                      </details>
                    </>
                  )}
                  {l.type === "Demo" && (
                    <>
                      <div className="hire-actions">
                        {(["screen", "audio", "face"] as const).map((k) => (
                          <label key={k}>
                            <input
                              type="checkbox"
                              checked={l[k]}
                              onChange={(e) =>
                                lever(l.id, { [k]: e.target.checked })
                              }
                            />
                            {k} capture
                          </label>
                        ))}
                      </div>
                      <small>
                        Screen or face required · {l.seconds}-second recording limit.
                      </small>
                      <Field
                        label="Research / prep countdown (seconds, 0 = off)"
                        type="number"
                        value={String(l.prep)}
                        onChange={(v) => lever(l.id, { prep: Number(v) })}
                      />
                      {l.beats.map((b, i) => (
                        <div className="hire-condition" key={i}>
                          <Field
                            label="At second"
                            type="number"
                            value={String(b.at)}
                            onChange={(v) =>
                              lever(l.id, {
                                beats: l.beats.map((x, j) =>
                                  i === j ? { ...x, at: Number(v) } : x,
                                ),
                              })
                            }
                          />
                          <Field
                            label="Teleprompter beat"
                            value={b.text}
                            onChange={(text) =>
                              lever(l.id, {
                                beats: l.beats.map((x, j) =>
                                  i === j ? { ...x, text } : x,
                                ),
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              lever(l.id, {
                                beats: l.beats.filter((_, j) => i !== j),
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {!a.publishedAt && (
                        <button
                          onClick={() =>
                            lever(l.id, {
                              beats: [...l.beats, { at: 0, text: "" }],
                            })
                          }
                        >
                          ＋ Teleprompter beat
                        </button>
                      )}
                      <label>
                        <input
                          type="checkbox"
                          checked={l.upload}
                          onChange={(e) =>
                            lever(l.id, { upload: e.target.checked })
                          }
                        />{" "}
                        Allow supporting file upload
                      </label>
                      {l.upload && (
                        <>
                          <Field
                            label="Upload label"
                            value={l.uploadLabel}
                            onChange={(uploadLabel) =>
                              lever(l.id, { uploadLabel })
                            }
                          />
                          <Field
                            label="Upload instructions"
                            value={l.uploadInstructions}
                            onChange={(uploadInstructions) =>
                              lever(l.id, { uploadInstructions })
                            }
                          />
                          <div className="hire-tags">
                            {[
                              "PDF",
                              "Word",
                              "PPT",
                              "Excel",
                              "ZIP",
                              "PNG",
                              "JPG",
                              "CSV",
                              "Text",
                              "MP4",
                            ].map((f) => (
                              <label key={f}>
                                <input
                                  type="checkbox"
                                  checked={l.formats.includes(f)}
                                  onChange={(e) =>
                                    lever(l.id, {
                                      formats: e.target.checked
                                        ? [...l.formats, f]
                                        : l.formats.filter((x) => x !== f),
                                    })
                                  }
                                />
                                {f}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                      <details>
                        <summary>Hidden rubric</summary>
                        <Field
                          label="Expected beats"
                          type="textarea"
                          value={l.expected}
                          onChange={(expected) => lever(l.id, { expected })}
                        />
                        <Field
                          label="Rubric anchors · name: probe"
                          type="textarea"
                          value={l.rubric}
                          onChange={(rubric) => lever(l.id, { rubric })}
                        />
                      </details>
                    </>
                  )}
                </fieldset>
              ))}
            </>
          )}
          {a.publishedAt && tab === "Assign" && (
            <>
              <p className="hire-callout">
                Select recipients in {a.stage}. Set expiry at least one hour
                after the demo clock.
              </p>
              <Field
                label="Link expires (local date and time)"
                type="datetime-local"
                value={expiry}
                onChange={setExpiry}
              />
              <div className="hire-form-grid">
                <section className="hire-card">
                  <h3>
                    Eligible in target stage (
                    {eligible.filter((c) => !roster.includes(c.id)).length})
                  </h3>
                  {eligible
                    .filter((c) => !roster.includes(c.id))
                    .map((c) => (
                      <button
                        className="hire-list-row"
                        key={c.id}
                        onClick={() => setRoster((v) => [...v, c.id])}
                      >
                        {c.name}
                        <span>＋ Add to roster</span>
                      </button>
                    ))}
                </section>
                <section className="hire-card">
                  <h3>Roster ({roster.length})</h3>
                  {roster.map((id) => (
                    <button
                      className="hire-list-row"
                      key={id}
                      onClick={() =>
                        setRoster((v) => v.filter((x) => x !== id))
                      }
                    >
                      {project.candidates[id]?.name}
                      <span>Remove</span>
                    </button>
                  ))}
                </section>
              </div>
              <button
                className="funnel-primary"
                disabled={!roster.length}
                onClick={() =>
                  run(() => {
                    inviteAssessment(
                      jobId,
                      a.id,
                      roster,
                      new Date(expiry).getTime(),
                    );
                    setRoster([]);
                  }, "Invitations sent to selected candidates in the demo outbox.")
                }
              >
                Send to candidates
              </button>
              {Object.entries(a.invites).map(([id, invite]) => (
                <article key={id} className="hire-card">
                  <strong>{project.candidates[id]?.name}</strong>
                  <p>
                    {invite.completed ? "Completed" : "Invited"} · Expires{" "}
                    {new Date(invite.expiresAt).toLocaleString()}
                  </p>
                  <div className="hire-actions">
                    <a
                      href={`/demo/assessment/${jobId}/${a.id}/${id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open candidate link ↗
                    </a>
                    <button
                      onClick={() =>
                        run(
                          () =>
                            copy(
                              `${location.origin}/demo/assessment/${jobId}/${a.id}/${id}`,
                            ),
                          "Candidate link copied.",
                        )
                      }
                    >
                      Copy link
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}
          {a.publishedAt && tab === "Responses" && (
            <>
              {Object.entries(a.invites)
                .filter(([, v]) => v.completed)
                .map(([id, v]) => (
                  <article className="hire-card" key={id}>
                    <h3>{project.candidates[id]?.name}</h3>
                    <small>{new Date(v.completed!).toLocaleString()}</small>
                    {Object.entries(v.answers || {}).map(([k, value]) => (
                      <p key={k}>
                        {k}: {value}
                      </p>
                    ))}
                  </article>
                ))}
              {!Object.values(a.invites).some((v) => v.completed) && (
                <Empty>
                  No responses yet. Open an invited candidate’s link to complete
                  the demo.
                </Empty>
              )}
            </>
          )}
          <div className="hire-sticky-actions">
            {a.publishedAt ? (
              <button
                onClick={() => {
                  const d = {
                    ...structuredClone(a),
                    id: crypto.randomUUID(),
                    title: `${a.title} · revision`,
                    version: a.version + 1,
                    publishedAt: undefined,
                    roster: [],
                    invites: {},
                  };
                  setDraft(d);
                  setActive(d.id);
                  setTab("Edit");
                }}
              >
                Duplicate to revise
              </button>
            ) : (
              <>
                <button onClick={() => save()}>Save draft</button>
                <button className="funnel-primary" onClick={() => save(true)}>
                  Publish and assign
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Remove this trip from the library? Existing invitations will no longer open.",
                  )
                )
                  run(() => {
                    change(jobId, `Deleted trip ${a.title}`, (o) => {
                      delete o.assessments[a.id];
                    });
                    exitToLibrary();
                  }, "Trip deleted from this demo; delivery history is preserved.");
              }}
            >
              Delete trip
            </button>
          </div>
        </>
      )}
    </>
  );
}
