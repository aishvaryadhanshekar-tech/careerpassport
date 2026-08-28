import { useMemo, useState, type JSX } from "react";
import "./ShareComposeModal.css";

export type SharePlatform = "LinkedIn" | "Email" | "WhatsApp";
export type ShareTone = "Warm" | "Direct" | "Editorial";

export type ShareComposeModalProps = {
  jobTitle: string;
  applicationLink: string;
  onClose: () => void;
};

function generateMessage({
  jobTitle,
  platform,
  tone,
  sender,
  userInput,
  applicationLink,
}: {
  jobTitle: string;
  platform: SharePlatform;
  tone: ShareTone;
  sender: string;
  userInput: string;
  applicationLink: string;
}): string {
  const context = userInput.trim();
  const contextLine = context ? ` (${context})` : "";
  let body = "";

  if (tone === "Warm") {
    if (platform === "LinkedIn") {
      body = `Hi there! We're so excited to be hiring for a ${jobTitle} role right now${contextLine} — I think you'd be a great fit! If this sounds interesting, I'd love for you to check it out.`;
    } else if (platform === "Email") {
      body = `Hi,\n\nHope you're doing well! I wanted to reach out because we're hiring for a ${jobTitle} position${contextLine} and thought of you. Would love for you to take a look when you get a chance.`;
    } else {
      body = `Hey! 👋 We're hiring a ${jobTitle}${contextLine} and I immediately thought you'd be perfect for it. Would you take a look?`;
    }
  } else if (tone === "Direct") {
    if (platform === "LinkedIn") {
      body = `We're hiring a ${jobTitle}${contextLine}. Here are the details and how to apply.`;
    } else if (platform === "Email") {
      body = `We have an open ${jobTitle} position${contextLine}. Please review the details below and apply if interested.`;
    } else {
      body = `Open role: ${jobTitle}${contextLine}. Apply below.`;
    }
  } else {
    if (platform === "LinkedIn") {
      body = `Now hiring: ${jobTitle}.${contextLine ? ` ${context}.` : ""} A role worth your attention.`;
    } else if (platform === "Email") {
      body = `${jobTitle} — Now Open\n\n${context || "A new opportunity worth exploring."}`;
    } else {
      body = `${jobTitle}. Now open.${contextLine ? ` ${context}.` : ""}`;
    }
  }

  const signature = sender ? `\n\n— ${sender}` : "";

  return `${body}${signature}\n\nApply here: ${applicationLink}`;
}

export function ShareComposeModal({
  jobTitle,
  applicationLink,
  onClose,
}: ShareComposeModalProps): JSX.Element {
  const [platform, setPlatform] = useState<SharePlatform>("LinkedIn");
  const [tone, setTone] = useState<ShareTone>("Warm");
  const [sender, setSender] = useState("Demo Recruiter");
  const [userInput, setUserInput] = useState("");

  const message = useMemo(
    () =>
      generateMessage({
        jobTitle,
        platform,
        tone,
        sender,
        userInput,
        applicationLink,
      }),
    [jobTitle, platform, tone, sender, userInput, applicationLink],
  );

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(applicationLink);
    } catch {
      // ignore clipboard failures
    }
  }

  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div
      className="compose-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="compose-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Share the application link"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="compose-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="compose-modal-linkbar">
          <span className="compose-modal-linkbar-icon" aria-hidden="true">
            🔗
          </span>
          <span className="compose-modal-linkbar-label">Application link</span>
          <span className="compose-modal-ready">✓ READY TO SHARE</span>
          <button
            type="button"
            className="compose-modal-btn compose-modal-btn-primary compose-modal-copylink"
            onClick={handleCopyLink}
          >
            <span aria-hidden="true">📋</span> Copy link
          </button>
        </div>

        <h2 className="compose-modal-heading">Share the application link</h2>

        <div className="compose-modal-columns">
          <div className="compose-modal-settings">
            <div className="compose-modal-section-label">
              COMPOSER SETTINGS
            </div>

            <label className="compose-modal-field">
              <span className="compose-modal-field-label">PLATFORM</span>
              <select
                value={platform}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setPlatform(event.target.value as SharePlatform)
                }
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </label>

            <label className="compose-modal-field">
              <span className="compose-modal-field-label">TONE</span>
              <select
                value={tone}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setTone(event.target.value as ShareTone)
                }
              >
                <option value="Warm">Warm</option>
                <option value="Direct">Direct</option>
                <option value="Editorial">Editorial</option>
              </select>
            </label>

            <label className="compose-modal-field">
              <span className="compose-modal-field-label">SENDER</span>
              <select
                value={sender}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setSender(event.target.value)
                }
              >
                <option value="Demo Recruiter">Demo Recruiter</option>
              </select>
            </label>

            <label className="compose-modal-field">
              <span className="compose-modal-field-label">YOUR INPUT</span>
              <textarea
                value={userInput}
                placeholder="Suggest any changes or add context for the message..."
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setUserInput(event.target.value)
                }
                rows={4}
              />
            </label>

            <button
              type="button"
              className="compose-modal-btn compose-modal-btn-outline compose-modal-generate"
              onClick={() => setUserInput((current) => current)}
            >
              <span aria-hidden="true">✨</span> Generate message
            </button>
          </div>

          <div className="compose-modal-preview">
            <div className="compose-modal-preview-header">
              <span className="compose-modal-preview-label">
                LIVE PREVIEW
              </span>
              <span className="compose-modal-preview-meta">
                {platform.toUpperCase()} · {tone.toUpperCase()}
              </span>
            </div>

            <div className="compose-modal-preview-body">
              {message.split("\n").map((line, index) => (
                <span key={index} className="compose-modal-preview-line">
                  {line}
                  <br />
                </span>
              ))}
            </div>

            <button
              type="button"
              className="compose-modal-btn compose-modal-btn-primary compose-modal-copymessage"
              onClick={handleCopyMessage}
            >
              Copy message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
