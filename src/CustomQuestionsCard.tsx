import { useState } from "react";
import { addQuestion, reorderItems } from "./applicationForm";
import { QuestionBlock, SectionBlock } from "./QuestionEditor";
import type { ApplicationConfig, ApplicationItem } from "./types";

export function CustomQuestionsCard({
  config,
  onChange,
}: {
  config: ApplicationConfig;
  onChange: (next: ApplicationConfig) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = config.items;
  const handleItemsChange = (next: ApplicationItem[]) =>
    onChange({ ...config, items: next });
  const sectionCount = items.filter(
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
            onClick={() => handleItemsChange(addQuestion(items))}
          >
            + Add question
          </button>
        </div>
      </header>
      <div className="app-card-body">
        {items.map((item, index) => {
          let sectionNumber = 0;
          if (item.kind === "section") {
            sectionNumber =
              items
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
                handleItemsChange(reorderItems(items, dragIndex, index));
                setDragIndex(null);
              }}
            >
              {item.kind === "section" ? (
                <SectionBlock
                  section={item}
                  sectionNumber={sectionNumber}
                  sectionTotal={sectionCount + 1}
                  onChange={handleItemsChange}
                  items={items}
                />
              ) : (
                <QuestionBlock question={item} items={items} onChange={handleItemsChange} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
