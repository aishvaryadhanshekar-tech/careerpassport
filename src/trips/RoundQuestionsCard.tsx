import { useState } from "react";
import { addQuestion, reorderItems } from "../applicationForm";
import { QuestionBlock } from "../QuestionEditor";
import type { ApplicationItem, CustomQuestion } from "../types";

export function RoundQuestionsCard({
  questions,
  onChange,
}: {
  questions: CustomQuestion[];
  onChange: (next: CustomQuestion[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // QuestionBlock is typed for the broader ApplicationItem[] shape (it also
  // backs the Applications editor, which mixes in section breaks). Rounds
  // never contain section breaks, so every item QuestionBlock hands back
  // here is still a CustomQuestion — this narrows back to that guarantee.
  const handleChange = (next: ApplicationItem[]) =>
    onChange(next as CustomQuestion[]);

  return (
    <section className="app-card" data-editor-anchor="questions">
      <header className="app-card-head">
        <h2>Questions</h2>
        <div className="app-card-head-actions">
          <button
            type="button"
            className="text-add"
            onClick={() => onChange(addQuestion(questions))}
          >
            + Add question
          </button>
        </div>
      </header>
      <div className="app-card-body">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="qblock-wrap"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex === null) return;
              onChange(reorderItems(questions, dragIndex, index));
              setDragIndex(null);
            }}
          >
            <QuestionBlock question={question} items={questions} onChange={handleChange} />
          </div>
        ))}
      </div>
    </section>
  );
}
