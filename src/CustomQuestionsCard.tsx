import { useState } from "react";
import { addQuestion, reorderItems } from "./applicationForm";
import { QuestionBlock, SectionBlock } from "./QuestionEditor";
import type { ApplicationConfig } from "./types";

export function CustomQuestionsCard({
  config,
  onChange,
}: {
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const sectionCount = config.items.filter(
    (item) => item.kind === "section",
  ).length;

  return (
    <section className="app-card" data-editor-anchor="questions">
      <header className="app-card-head">
        <h2>Questions</h2>
        <div className="app-card-head-actions">
          <button
            type="button"
            className="text-add"
            onClick={() => onChange(addQuestion(config))}
          >
            + Add question
          </button>
        </div>
      </header>
      <div className="app-card-body">
        {config.items.map((item, index) => {
          let sectionNumber = 0;
          if (item.kind === "section") {
            sectionNumber =
              config.items
                .slice(0, index + 1)
                .filter((entry) => entry.kind === "section").length + 1;
          }
          return (
            <div
              key={item.id}
              className="qblock-wrap"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null) return;
                onChange(reorderItems(config, dragIndex, index));
                setDragIndex(null);
              }}
            >
              {item.kind === "section" ? (
                <SectionBlock
                  section={item}
                  sectionNumber={sectionNumber}
                  sectionTotal={sectionCount + 1}
                  onChange={onChange}
                  config={config}
                />
              ) : (
                <QuestionBlock question={item} config={config} onChange={onChange} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
