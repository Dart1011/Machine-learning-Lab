export function createDraft(mission) {
  switch (mission.type) {
    case 'choice':
      return { value: null };
    case 'sequence':
    case 'matrix':
    case 'rows':
    case 'encoding':
      return { selected: [] };
    case 'numeric':
      return { value: '' };
    case 'metrics':
      return { values: { precision: '', recall: '', f1: '' } };
    case 'tuning':
      return { value: mission.depths[0] };
    case 'threshold':
      return { value: 0.8 };
    case 'code':
      return {};
    default:
      return {};
  }
}

export function calculateConfusion(cases, threshold) {
  const result = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (const item of cases) {
    const predicted = item.score >= threshold ? 1 : 0;
    if (predicted === 1 && item.actual === 1) result.tp += 1;
    if (predicted === 1 && item.actual === 0) result.fp += 1;
    if (predicted === 0 && item.actual === 1) result.fn += 1;
    if (predicted === 0 && item.actual === 0) result.tn += 1;
  }
  const precision = result.tp + result.fp === 0 ? 0 : result.tp / (result.tp + result.fp);
  const recall = result.tp + result.fn === 0 ? 0 : result.tp / (result.tp + result.fn);
  const accuracy = (result.tp + result.tn) / cases.length;
  return { ...result, precision, recall, accuracy };
}

function sameSet(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  const selected = new Set(actual);
  return selected.size === actual.length && expected.every((item) => selected.has(item));
}

function sameSequence(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

function closeEnough(value, expected, tolerance = 0.001) {
  if (value === '' || value === null || value === undefined) return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) && Math.abs(numeric - expected) <= tolerance;
}

export function hasAnswer(mission, draft) {
  switch (mission.type) {
    case 'choice':
      return Boolean(draft.value);
    case 'sequence':
      return draft.selected.length === mission.items.length;
    case 'matrix':
    case 'rows':
    case 'encoding':
      return draft.selected.length > 0;
    case 'numeric':
      return String(draft.value).trim() !== '';
    case 'metrics':
      return Object.values(draft.values).every((value) => String(value).trim() !== '');
    case 'code':
      return true;
    default:
      return true;
  }
}

export function evaluateMission(mission, draft) {
  let correct = false;
  let detail = '';

  switch (mission.type) {
    case 'choice':
      correct = draft.value === mission.answer;
      break;
    case 'sequence':
      correct = sameSequence(draft.selected, mission.answer);
      break;
    case 'matrix':
    case 'rows':
    case 'encoding':
      correct = sameSet(draft.selected, mission.answer);
      break;
    case 'numeric':
      correct = closeEnough(draft.value, mission.answer, mission.tolerance);
      break;
    case 'metrics':
      correct = Object.entries(mission.expected).every(([key, expected]) => (
        closeEnough(draft.values[key], expected, mission.tolerances[key])
      ));
      break;
    case 'tuning':
      correct = Number(draft.value) === mission.answer;
      detail = `${mission.validation[mission.depths.indexOf(Number(draft.value))]}% validation accuracy at depth ${draft.value}.`;
      break;
    case 'threshold': {
      const metrics = calculateConfusion(mission.cases, Number(draft.value));
      correct = metrics.recall >= mission.minRecall && metrics.precision >= mission.minPrecision;
      detail = `${Math.round(metrics.recall * 100)}% recall and ${Math.round(metrics.precision * 100)}% precision.`;
      break;
    }
    default:
      correct = false;
  }

  return { correct, detail };
}

export function missionProgress(sessions, completedIds) {
  const completed = new Set(completedIds);
  return sessions.map((session) => ({
    id: session.id,
    completed: session.missions.filter((mission) => completed.has(mission.id)).length,
    total: session.missions.length,
  }));
}
