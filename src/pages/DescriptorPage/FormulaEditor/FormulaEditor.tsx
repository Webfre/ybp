import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  descriptorDataTypeLabels,
} from "../../../entities/descriptor/model/dictionaries";
import type {
  Descriptor,
  DescriptorDraft,
  FormulaArgument,
} from "../../../entities/descriptor/model/types";
import { validateFormula, type ValidationIssue } from "../../../shared/lib/validation";
import {
  Badge,
  Button,
  IconButton,
  Select,
  Textarea,
} from "../../../shared/ui";
import styles from "./FormulaEditor.module.scss";

const operators = ["+", "-", "*", "/", "(", ")", "="];

const functionTemplates = [
  {
    description: "Суммирование аргумента или набора значений.",
    label: "SUM",
    template: "SUM(B)",
  },
  {
    description: "Среднее значение аргумента.",
    label: "AVG",
    template: "AVG(B)",
  },
  {
    description: "Минимальное значение.",
    label: "MIN",
    template: "MIN(B)",
  },
  {
    description: "Максимальное значение.",
    label: "MAX",
    template: "MAX(B)",
  },
  {
    description: "Условное выражение. Синтаксис пока демонстрационный.",
    label: "IF",
    template: "IF(B > 0; C / B; 0)",
  },
];

const formulaExamples = [
  {
    description: "Разница между фактическим и плановым значением.",
    formula: "A = B - C",
    title: "Отклонение",
  },
  {
    description: "Доля факта от плана в процентах.",
    formula: "A = B / C * 100",
    title: "Процент выполнения",
  },
  {
    description: "Защита от деления на ноль в условной формуле.",
    formula: "A = IF(C > 0; B / C; 0)",
    title: "Условный расчет",
  },
];

const helperHints = [
  "A всегда означает текущий редактируемый показатель.",
  "Перед использованием B, C или D добавьте показатель в список аргументов.",
  "Формула должна начинаться с левой части A = ...",
  "Кнопки операторов и функций вставляют заготовку в конец формулы.",
  "Предупреждения не блокируют сохранение макета, но показывают спорные места.",
];

type FormulaEditorProps = {
  currentDescriptor: DescriptorDraft;
  descriptors: Descriptor[];
  issues: ValidationIssue[];
  onFormulaIssuesChange: (issues: ValidationIssue[]) => void;
  onUpdate: (patch: Partial<DescriptorDraft>) => void;
};

type FormulaCheckStatus = "idle" | "valid" | "warning" | "error";

function normalizeFormulaArguments(
  currentDescriptor: DescriptorDraft,
): FormulaArgument[] {
  const currentArgument: FormulaArgument = {
    descriptorId: currentDescriptor.id,
    letter: "A",
  };
  const otherArguments = currentDescriptor.formulaArguments.filter(
    (argument) =>
      argument.descriptorId !== currentDescriptor.id && argument.letter !== "A",
  );

  return [currentArgument, ...otherArguments];
}

function getNextLetter(argumentsList: FormulaArgument[]) {
  const usedLetters = new Set(argumentsList.map((argument) => argument.letter));
  const alphabet = "BCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return alphabet.find((letter) => !usedLetters.has(letter));
}

function getArgumentDescriptor(
  argument: FormulaArgument,
  currentDescriptor: DescriptorDraft,
  descriptors: Descriptor[],
) {
  if (argument.descriptorId === currentDescriptor.id) {
    return currentDescriptor;
  }

  return descriptors.find((descriptor) => descriptor.id === argument.descriptorId);
}

function appendToken(formula: string, token: string) {
  const nextToken = token.length === 1 ? ` ${token} ` : token;
  const separator = formula.trim() && !formula.endsWith(" ") ? " " : "";

  return `${formula}${separator}${nextToken}`.replace(/\s{2,}/g, " ");
}

export function FormulaEditor({
  currentDescriptor,
  descriptors,
  issues,
  onFormulaIssuesChange,
  onUpdate,
}: FormulaEditorProps) {
  const [checkStatus, setCheckStatus] = useState<FormulaCheckStatus>("idle");
  const normalizedFormulaArguments = useMemo(
    () => normalizeFormulaArguments(currentDescriptor),
    [currentDescriptor],
  );
  const selectedArgumentIds = new Set(
    normalizedFormulaArguments.map((argument) => argument.descriptorId),
  );
  const availableMetrics = descriptors.filter(
    (descriptor) =>
      descriptor.usage === "metric" &&
      descriptor.id !== currentDescriptor.id &&
      !selectedArgumentIds.has(descriptor.id),
  );

  const usedLetters = useMemo(
    () => new Set(currentDescriptor.formula.match(/\b[A-Z]\b/g) ?? []),
    [currentDescriptor.formula],
  );

  function updateFormula(nextFormula: string) {
    onUpdate({ formula: nextFormula });
    onFormulaIssuesChange([]);
    setCheckStatus("idle");
  }

  function insertToken(token: string) {
    updateFormula(appendToken(currentDescriptor.formula, token));
  }

  function addArgument(descriptorId: string) {
    const nextLetter = getNextLetter(normalizedFormulaArguments);

    if (!nextLetter) {
      toast.error("Свободные буквенные обозначения закончились");
      return;
    }

    onUpdate({
      formulaArguments: [
        ...normalizedFormulaArguments,
        { descriptorId, letter: nextLetter },
      ],
    });
    onFormulaIssuesChange([]);
    setCheckStatus("idle");
  }

  function removeArgument(argument: FormulaArgument) {
    if (argument.letter === "A") {
      return;
    }

    if (usedLetters.has(argument.letter)) {
      toast.error(`Аргумент ${argument.letter} используется в формуле`);
      return;
    }

    onUpdate({
      formulaArguments: normalizedFormulaArguments.filter(
        (item) => item.letter !== argument.letter,
      ),
    });
    onFormulaIssuesChange([]);
    setCheckStatus("idle");
  }

  function validateCurrentFormula() {
    const nextIssues = validateFormula(currentDescriptor.formula, {
      arguments: normalizedFormulaArguments,
      currentLetter: "A",
    });
    const hasErrors = nextIssues.some((issue) => issue.tone === "error");

    onFormulaIssuesChange(nextIssues);
    setCheckStatus(
      hasErrors ? "error" : nextIssues.length > 0 ? "warning" : "valid",
    );

    if (hasErrors) {
      toast.error("Формула содержит ошибки");
      return;
    }

    toast.success(
      nextIssues.length ? "Формула проверена, есть предупреждения" : "Формула прошла мок-проверку",
    );
  }

  return (
    <div className={styles.formulaWorkspace}>
      <aside className={styles.argumentPanel}>
        <div>
          <h2>Аргументы</h2>
          <p>A - текущий показатель, остальные аргументы выбираются из показателей.</p>
        </div>

        <div className={styles.argumentList}>
          {normalizedFormulaArguments.map((argument) => {
            const argumentDescriptor = getArgumentDescriptor(
              argument,
              currentDescriptor,
              descriptors,
            );
            const isUsed = usedLetters.has(argument.letter);

            return (
              <article className={styles.argumentCard} key={argument.letter}>
                <div className={styles.argumentHeader}>
                  <span className={styles.letter}>{argument.letter}</span>
                  <div>
                    <strong>{argumentDescriptor?.name ?? "Не выбран"}</strong>
                    <span>{argumentDescriptor?.code ?? "—"}</span>
                  </div>
                  {argument.letter !== "A" && (
                    <IconButton
                      ariaLabel={
                        isUsed
                          ? `Аргумент ${argument.letter} используется в формуле. Сначала уберите ${argument.letter} из текста формулы`
                          : `Удалить аргумент ${argument.letter}`
                      }
                      disabled={isUsed}
                      icon="remove"
                      tone="danger"
                      onClick={() => removeArgument(argument)}
                    />
                  )}
                </div>
                <div className={styles.argumentMeta}>
                  <Badge tone="accent">
                    {argumentDescriptor?.dataType
                      ? descriptorDataTypeLabels[argumentDescriptor.dataType]
                      : "Тип не выбран"}
                  </Badge>
                  <span>
                    Разрезов: {argumentDescriptor?.analyticDimensions.length ?? 0}
                  </span>
                </div>
                {isUsed && argument.letter !== "A" && (
                  <span className={styles.lockedHint}>
                    Удаление заблокировано: {argument.letter} есть в формуле.
                  </span>
                )}
                <Button
                  variant="secondary"
                  onClick={() => insertToken(argument.letter)}
                >
                  Вставить {argument.letter}
                </Button>
              </article>
            );
          })}
        </div>

        <Select
          label="Добавить показатель"
          options={availableMetrics.map((descriptor) => ({
            label: `${descriptor.code} / ${descriptor.name}`,
            value: descriptor.id,
          }))}
          placeholder="Выберите показатель"
          onChange={addArgument}
        />
      </aside>

      <section className={styles.editorPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Редактор формулы</h2>
            <p>Соберите правило расчета текущего показателя через выбранные аргументы.</p>
          </div>
          <Button icon="check" variant="secondary" onClick={validateCurrentFormula}>
            Проверить
          </Button>
        </div>

        <div className={styles.quickInsert}>
          <div>
            <span className={styles.groupLabel}>Операторы</span>
            <div className={styles.buttonGroup}>
              {operators.map((operator) => (
                <button key={operator} type="button" onClick={() => insertToken(operator)}>
                  {operator}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={styles.groupLabel}>Функции</span>
            <div className={styles.buttonGroup}>
              {functionTemplates.map((item) => (
                <button
                  key={item.label}
                  title={item.description}
                  type="button"
                  onClick={() => insertToken(item.template)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Textarea
          error={issues.find((issue) => issue.tone === "error")?.message}
          hint="Пример: A = B - C. Поддержка функций в MVP демонстрационная."
          label="Формула вычисляемого показателя"
          placeholder="A = B - C"
          value={currentDescriptor.formula}
          onChange={(event) => updateFormula(event.target.value)}
        />

        <div className={styles.feedbackGrid}>
          <div className={styles.helpPanel}>
            <h3>Интуитивные подсказки</h3>
            <ul>
              {helperHints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>

          <div className={styles.issuePanel}>
            <h3>Результат проверки</h3>
            {checkStatus === "idle" ? (
              <p>Запустите проверку, чтобы увидеть ошибки и предупреждения.</p>
            ) : issues.length === 0 ? (
              <div className={styles.issueList}>
                <div className={styles.issue}>
                  <Badge tone="success">Корректно</Badge>
                  <span>
                    Мок-проверка пройдена: левая часть A, выбранные аргументы и скобки согласованы.
                  </span>
                </div>
                <p>
                  Реальное значение пока не рассчитывается: в MVP нет согласованного DSL/API и входных значений.
                </p>
              </div>
            ) : (
              <div className={styles.issueList}>
                {issues.map((issue) => (
                  <div className={styles.issue} key={`${issue.tone}-${issue.message}`}>
                    <Badge tone={issue.tone === "error" ? "danger" : "warning"}>
                      {issue.tone === "error" ? "Ошибка" : "Предупреждение"}
                    </Badge>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.examples}>
          <h3>Примеры формул</h3>
          <div className={styles.exampleList}>
            {formulaExamples.map((example) => (
              <button
                key={example.title}
                type="button"
                onClick={() => updateFormula(example.formula)}
              >
                <strong>{example.title}</strong>
                <code>{example.formula}</code>
                <span>{example.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.contextNote}>
          <Badge tone="neutral">MVP</Badge>
          <span>
            Этот редактор показывает будущий UX формул. Реальный синтаксис и вычисление
            можно будет подключить позже, когда будет согласован DSL/API.
          </span>
        </div>
      </section>
    </div>
  );
}
