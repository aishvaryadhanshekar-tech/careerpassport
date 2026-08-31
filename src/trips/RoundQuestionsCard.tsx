import { useState } from "react";
import { addQuestion, reorderItems } from "../applicationForm";
import { QuestionBlock } from "../QuestionEditor";
import { rewriteSingleQuestion } from "../tripAIBuild";
import { STAGE_OPTION_CONSTRAINTS } from "../tripStages";
import type { ApplicationItem, CustomQuestion, Difficulty, InferenceCard, StageType } from "../types";

export function RoundQuestionsCard({
  questions,
  onChange,
  stageType,
  inferenceCards,
  difficulty,
}: {
  questions: CustomQuestion[];
  onChange: (next: CustomQuestion[]) => void;
  /**
   * The lever type this round of questions belongs to. Optional — supplying it enables both
   * the lever-aware option-card constraints (e.g. rapid-fire staying binary) and, together with
   * `inferenceCards`/`difficulty`, the per-question AI-rewrite button. Omit it and both stay
   * inert (unconstrained options, no rewrite button) rather than erroring.
   *
   * NOTE: today's only caller (`TripRoundTabs.tsx`) doesn't pass this yet — wiring it up there
   * requires touching `TripRoundTabs.tsx`, which is off-limits for this workstream (owned by a
   * parallel agent). Flagging back to the leader: once safe, `TripRoundTabs.tsx` should pass
   * `stageType={activeStage.type}`, `inferenceCards={trip.inferenceCards}`, and
   * `difficulty={trip.difficulty}` into `<RoundQuestionsCard>` to light up per-question rewrite.
   */
  stageType?: StageType;
  inferenceCards?: InferenceCard[];
  difficulty?: Difficulty;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // QuestionBlock is typed for the broader ApplicationItem[] shape (it also
  // backs the Applications editor, which mixes in section breaks). Rounds
  // never contain section breaks, so every item QuestionBlock hands back
  // here is still a CustomQuestion — this narrows back to that guarantee.
  const handleChange = (next: ApplicationItem[]) =>
    onChange(next as CustomQuestion[]);

  const optionConstraints = stageType ? STAGE_OPTION_CONSTRAINTS[stageType] : undefined;
  const canRewriteWithAI = stageType !== undefined && inferenceCards !== undefined && difficulty !== undefined;

  function handleRewriteQuestion(questionId: string) {
    if (!canRewriteWithAI || !stageType || !inferenceCards || !difficulty) return;
    const current = questions.find((q) => q.id === questionId);
    if (!current) return;
    const rewritten = rewriteSingleQuestion(stageType, current, inferenceCards, difficulty);
    onChange(questions.map((q) => (q.id === questionId ? rewritten : q)));
  }

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
            <QuestionBlock
              question={question}
              items={questions}
              onChange={handleChange}
              optionConstraints={optionConstraints}
              enableDictation
              onRewriteWithAI={
                canRewriteWithAI ? () => handleRewriteQuestion(question.id) : undefined
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
