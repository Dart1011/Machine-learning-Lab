const STORAGE_KEY = 'gci-skills-lab-progress-v1';
const CODE_KEY = 'gci-skills-lab-code-v1';

export function loadProgress(validMissionIds, validPartIds = []) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const valid = new Set(validMissionIds);
    const validParts = new Set(validPartIds);
    const completed = Array.isArray(saved.completed)
      ? [...new Set(saved.completed.filter((id) => valid.has(id)))]
      : [];
    const codeParts = Array.isArray(saved.codeParts)
      ? [...new Set(saved.codeParts.filter((id) => validParts.has(id)))]
      : [];
    return { completed, codeParts };
  } catch {
    return { completed: [], codeParts: [] };
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CODE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadCodeDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem(CODE_KEY) || '{}');
    return Object.fromEntries(Object.entries(saved).filter(([, value]) => typeof value === 'string'));
  } catch {
    return {};
  }
}

export function saveCodeDrafts(drafts) {
  try {
    localStorage.setItem(CODE_KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false;
  }
}
