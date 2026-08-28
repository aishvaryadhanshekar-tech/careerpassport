import { useState, type JSX } from "react";
import { MESSAGE_TEMPLATES } from "../communications/templates";
import "../communications/communications.css";
import { useJobContext } from "./jobContext";
import {
  DEFAULT_PIPELINE_STAGES,
  MESSAGE_CHANNEL_LABELS,
  MESSAGE_INTENT_LABELS,
  TEMPLATE_TOKENS,
  renderTemplate,
  type MessageTemplate,
} from "../types";

/** Sample values used for the previews on this tab — no candidate is selected here. */
const SAMPLE = {
  candidate_name: "Priya Nair",
  company: "Conte",
  sender_name: "Alex Smith",
  stage: "Screened",
};

/**
 * The job's message templates, grouped by the pipeline stage they are offered on.
 *
 * Read-only for now: this is the seam where the Communications module will take over, so
 * the tab shows what the pipeline will offer rather than pretending to be an editor.
 */
export function CommunicationsTab(): JSX.Element {
  const { draft } = useJobContext();
  const [openId, setOpenId] = useState<string | null>(null);
  const jobTitle = draft.fields.designation.value.trim() || "this role";

  const groups = [
    ...DEFAULT_PIPELINE_STAGES.map((stage) => ({
      key: stage.id,
      label: stage.label,
      templates: MESSAGE_TEMPLATES.filter(
        (t) => t.scope !== "all" && t.scope.includes(stage.id),
      ),
    })),
    {
      key: "all",
      label: "Any stage",
      templates: MESSAGE_TEMPLATES.filter((t) => t.scope === "all"),
    },
  ].filter((group) => group.templates.length > 0);

  function values(template: MessageTemplate, stageLabel: string) {
    return {
      ...SAMPLE,
      job_title: jobTitle,
      stage: template.scope === "all" ? SAMPLE.stage : stageLabel,
    };
  }

  return (
    <div className="comms-tab">
      <header className="comms-tab-head">
        <h2>Templates</h2>
        <p>
          Messages a hiring manager can send from the Pipeline board. Each card offers the
          templates scoped to that candidate's stage, plus anything listed under Any stage.
        </p>
      </header>

      <div className="comms-groups">
        {groups.map((group) => (
          <section className="comms-group" key={group.key}>
            <div className="comms-group-head">
              <h3>{group.label}</h3>
              <span className="comms-group-count">
                {group.templates.length} template
                {group.templates.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="comms-list">
              {group.templates.map((template) => {
                const open = openId === template.id;
                return (
                  <li key={`${group.key}-${template.id}`}>
                    <button
                      type="button"
                      className={`comms-item intent-${template.intent}`}
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : template.id)}
                    >
                      <span className="comms-item-main">
                        <span className="comms-item-name">{template.name}</span>
                        <span className="comms-item-blurb">{template.blurb}</span>
                      </span>
                      <span className="comms-item-tags">
                        <span className="msg-channel-chip">
                          {MESSAGE_CHANNEL_LABELS[template.channel]}
                        </span>
                        <span className={`comms-intent-chip intent-${template.intent}`}>
                          {MESSAGE_INTENT_LABELS[template.intent]}
                        </span>
                      </span>
                    </button>
                    {open ? (
                      <div className="comms-item-preview">
                        {template.subject ? (
                          <p className="msg-preview-subject">
                            {renderTemplate(
                              template.subject,
                              values(template, group.label),
                            )}
                          </p>
                        ) : null}
                        <pre className="msg-preview-body">
                          {renderTemplate(template.body, values(template, group.label))}
                        </pre>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <footer className="comms-tokens">
        <h3>Available tokens</h3>
        <ul>
          {TEMPLATE_TOKENS.map((token) => (
            <li key={token.token}>
              <code>{token.token}</code>
              <span>{token.description}</span>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
