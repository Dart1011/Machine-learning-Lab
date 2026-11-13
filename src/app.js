import { sessions, totalMissions, getSession } from './course.js';
import { calculateConfusion, createDraft, evaluateMission, hasAnswer } from './exercises.js';
import { clearProgress, loadCodeDrafts, loadProgress, saveCodeDrafts, saveProgress } from './storage.js';
import { runPythonPart } from './pythonRunner.js';
import { cvChart, heroChart, icon, miniChart, scatterChart, tuningChart } from './visuals.js';

const app = document.querySelector('#app');
const allMissions = sessions.flatMap((session) => session.missions);
const allMissionIds = allMissions.map((mission) => mission.id);
const allCodePartIds = allMissions.filter((mission) => mission.type === 'code').flatMap((mission) => mission.lab.parts.map((part) => part.id));
const state = {
  view: 'home',
  sessionId: 1,
  missionId: sessions[0].missions[0].id,
  progress: loadProgress(allMissionIds, allCodePartIds),
  drafts: new Map(),
  feedback: null,
  showHint: false,
  lessonOpen: true,
  modal: null,
  confirmReset: false,
  justCompleted: false,
  toast: null,
  codeDrafts: loadCodeDrafts(),
  codeResults: new Map(),
  labSelections: new Map(),
  solutionVisibility: new Set(),
  codeRunning: false,
  codeRunVersion: 0,
  runtimeMessage: '',
};
let codeSaveTimer;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function currentSession() {
  return getSession(state.sessionId);
}

function currentMission() {
  return currentSession().missions.find((mission) => mission.id === state.missionId);
}

function getDraft(mission = currentMission()) {
  if (!state.drafts.has(mission.id)) {
    state.drafts.set(mission.id, createDraft(mission));
  }
  return state.drafts.get(mission.id);
}

function selectedPartIndex(mission) {
  if (state.labSelections.has(mission.id)) return state.labSelections.get(mission.id);
  const firstIncomplete = mission.lab.parts.findIndex((part) => !state.progress.codeParts.includes(part.id));
  return firstIncomplete >= 0 ? firstIncomplete : 0;
}

function currentCodePart(mission = currentMission()) {
  return mission.lab.parts[selectedPartIndex(mission)];
}

function currentCode(part = currentCodePart()) {
  return state.codeDrafts[part.id] ?? part.starter;
}

function persistCodeDrafts() {
  clearTimeout(codeSaveTimer);
  codeSaveTimer = setTimeout(() => saveCodeDrafts(state.codeDrafts), 250);
}

function completedCount(session) {
  return session.missions.filter((mission) => state.progress.completed.includes(mission.id)).length;
}

function earnedXp() {
  return allMissions
    .filter((mission) => state.progress.completed.includes(mission.id))
    .reduce((total, mission) => total + mission.xp, 0);
}

function nextLearningTarget() {
  for (const session of sessions) {
    const mission = session.missions.find((item) => !state.progress.completed.includes(item.id));
    if (mission) return { session, mission };
  }
  return null;
}

function navigate(sessionId, missionId) {
  const nextHash = `#session/${sessionId}/${missionId}`;
  if (window.location.hash === nextHash) {
    openMission(sessionId, missionId);
  } else {
    window.location.hash = nextHash;
  }
}

function openMission(sessionId, missionId) {
  const session = getSession(sessionId);
  if (!session) return;
  const mission = session.missions.find((item) => item.id === missionId) || session.missions[0];
  state.view = 'session';
  state.sessionId = session.id;
  state.missionId = mission.id;
  state.feedback = null;
  state.showHint = false;
  state.lessonOpen = true;
  state.modal = null;
  state.justCompleted = false;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function goHome(scrollToCurriculum = false) {
  state.view = 'home';
  state.modal = null;
  state.feedback = null;
  state.justCompleted = false;
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  renderApp();
  if (scrollToCurriculum) {
    requestAnimationFrame(() => document.querySelector('#curriculum')?.scrollIntoView({ behavior: 'smooth' }));
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function renderHeader() {
  const count = state.progress.completed.length;
  const percent = Math.round((count / totalMissions) * 100);
  return `
    <header class="site-header">
      <div class="container header-inner">
        <button class="brand" type="button" data-action="home" aria-label="GCI Skills Lab home">
          <span class="brand-mark">${icon('logo')}</span>
          <span class="brand-name">GCI <span>Skills Lab</span></span>
        </button>
        <nav class="header-nav" aria-label="Main navigation">
          <button class="nav-button" type="button" data-action="curriculum">${icon('grid', 'icon-sm')}<span class="nav-label">Curriculum</span></button>
          <button class="nav-button" type="button" data-action="progress">${icon('chart', 'icon-sm')}<span class="nav-label">My progress</span></button>
          <button class="header-progress" type="button" data-action="progress" aria-label="${percent}% of missions complete">
            <span class="mini-ring" style="--progress:${percent * 3.6}deg"><span>${percent}%</span></span>
            <span class="header-progress-text"><strong>${count} / ${totalMissions} missions</strong>${earnedXp().toLocaleString()} XP earned</span>
          </button>
        </nav>
      </div>
    </header>`;
}

function renderSessionCard(session) {
  const complete = completedCount(session);
  const action = complete === 0 ? 'Start session' : complete === session.missions.length ? 'Review session' : 'Continue';
  return `
    <button class="session-card" type="button" data-action="open-session" data-session="${session.id}" style="--accent:${session.color};--accent-soft:${session.soft}" aria-label="${action}: Session ${session.id}, ${escapeHtml(session.shortTitle)}">
      <span class="card-top">
        <span class="session-icon">${icon(session.icon)}</span>
        <span class="session-number">Session ${String(session.id).padStart(2, '0')}</span>
      </span>
      <h3>${escapeHtml(session.shortTitle)}</h3>
      <span class="session-card-description">${escapeHtml(session.description)}</span>
      <span class="skill-tags">${session.outcomes.slice(0, 3).map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}</span>
      <span class="card-bottom">
        <span class="mission-dots" aria-label="${complete} of ${session.missions.length} missions complete">
          ${session.missions.map((mission) => `<span class="mission-dot ${state.progress.completed.includes(mission.id) ? 'done' : ''}"></span>`).join('')}
        </span>
        <span class="card-action">${action}${icon('arrowRight', 'icon-sm')}</span>
      </span>
    </button>`;
}

function renderHome() {
  const target = nextLearningTarget();
  const count = state.progress.completed.length;
  const primaryLabel = count === 0 ? 'Start learning' : target ? `Continue Session ${target.session.id}` : 'Review your progress';
  return `
    <main>
      <section class="container hero">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>Your interactive GCI companion</span>
          <h1>Don't just watch.<br><span class="highlight">Learn by doing.</span></h1>
          <p class="hero-description">Turn Sessions 1–9 into small, hands-on wins. Short explanations, visual experiments, and instant feedback help data science finally click.</p>
          <div class="hero-actions">
            <button class="button button-primary" type="button" data-action="continue">${primaryLabel}${icon('arrowRight')}</button>
            <button class="button button-secondary" type="button" data-action="curriculum">Explore the skills${icon('grid')}</button>
          </div>
          <div class="hero-proof">
            <span class="proof-icons"><span>${icon('flask', 'icon-sm')}</span><span>${icon('code', 'icon-sm')}</span><span>${icon('medal', 'icon-sm')}</span></span>
            <span>No setup anxiety. No prior experience needed.<br>Your progress stays in this browser.</span>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="hero-board">
            <div class="board-top"><span class="board-dots"><i></i><i></i><i></i></span><span class="board-label">Your learning loop</span></div>
            <div class="board-title">From raw data to real decisions</div>
            <div class="board-subtitle">Small experiments. Real understanding.</div>
            <div class="pipeline">
              <span class="pipeline-step"><span class="pipeline-icon">${icon('table')}</span>Raw data</span>${icon('arrowRight', 'pipeline-arrow')}
              <span class="pipeline-step"><span class="pipeline-icon">${icon('chart')}</span>Explore</span>${icon('arrowRight', 'pipeline-arrow')}
              <span class="pipeline-step"><span class="pipeline-icon">${icon('brain')}</span>Model</span>${icon('arrowRight', 'pipeline-arrow')}
              <span class="pipeline-step"><span class="pipeline-icon">${icon('target')}</span>Decide</span>
            </div>
            <div class="board-chart"><div class="chart-heading"><span>Skills grow with practice</span><span class="trend-pill">Interactive</span></div>${heroChart()}</div>
          </div>
          <div class="floating-note note-one">${icon('play')}Try it. Get feedback. Get it.</div>
          <div class="floating-note note-two">${icon('sparkles')}Earn XP as you learn</div>
        </div>
      </section>
      <section class="container stats-strip" aria-label="Course summary">
        <div class="stat-item"><span class="stat-number">9</span><span class="stat-label">Guided course sessions</span></div>
        <div class="stat-item"><span class="stat-number">${totalMissions}</span><span class="stat-label">Hands-on missions</span></div>
        <div class="stat-item"><span class="stat-number">27</span><span class="stat-label">Guided Python tasks</span></div>
        <div class="stat-item"><span class="stat-number">100%</span><span class="stat-label">Free and local</span></div>
      </section>
      <section class="container curriculum-section" id="curriculum">
        <div class="section-heading">
          <div><span class="section-kicker">Your learning path</span><h2>From data to decisions</h2><p>Follow the sessions in order or jump into the skill you need. Every mission includes a quick lesson, a hands-on task, and a clear explanation.</p></div>
          <div class="progress-summary"><div class="progress-summary-label"><span>Overall progress</span><strong>${count}/${totalMissions}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${(count / totalMissions) * 100}%"></div></div></div>
        </div>
        <div class="session-grid">${sessions.map(renderSessionCard).join('')}</div>
      </section>
    </main>
    <footer class="home-footer"><div class="container footer-inner"><span>Designed to complement—not replace—your original slides and notebooks.</span><a class="footer-link" href="https://drive.google.com/drive/folders/1Gsfpg2E-LEPB60eJMAYEchrnOjTofsN6" target="_blank" rel="noopener">Open GCI course materials${icon('external', 'icon-sm')}</a></div></footer>`;
}

function renderSidebar(session) {
  return `
    <aside class="mission-sidebar" aria-label="Session missions">
      <div class="sidebar-heading">Your missions</div>
      ${session.missions.map((mission, index) => {
        const done = state.progress.completed.includes(mission.id);
        return `<button class="mission-nav-item ${mission.id === state.missionId ? 'active' : ''} ${done ? 'done' : ''}" type="button" data-action="open-mission" data-session="${session.id}" data-mission="${mission.id}" aria-current="${mission.id === state.missionId ? 'step' : 'false'}">
          <span class="mission-check">${done ? icon('check', 'icon-sm') : index + 1}</span>
          <span class="mission-nav-text"><strong>${escapeHtml(mission.title)}</strong><small>${mission.duration} · ${mission.xp} XP</small></span>
        </button>`;
      }).join('')}
      <div class="sidebar-reference"><h4>${icon('book', 'icon-sm')}In this session</h4><p>${session.outcomes.map(escapeHtml).join(' · ')}</p><a href="${session.source}" target="_blank" rel="noopener">Original materials${icon('external', 'icon-sm')}</a></div>
    </aside>`;
}

function renderLesson(mission) {
  return `
    <div class="lesson-panel">
      <button class="lesson-toggle" type="button" data-action="toggle-lesson" aria-expanded="${state.lessonOpen}"><span>${icon('book', 'icon-sm')}Quick lesson · learn this first</span>${icon('chevronDown', 'icon-sm')}</button>
      ${state.lessonOpen ? `<div class="lesson-content"><h3>${escapeHtml(mission.lesson.title)}</h3><ul>${mission.lesson.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul><div class="lesson-example">${mission.lesson.example}</div></div>` : ''}
    </div>`;
}

function renderDataTable(mission) {
  if (!mission.rowsData) return '';
  return `<div class="data-table-wrapper"><table class="data-table"><thead><tr>${mission.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${mission.rowsData.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function optionState(mission, value) {
  const selected = getDraft(mission).value === value;
  if (!selected) return '';
  if (state.feedback?.status === 'success') return 'correct';
  if (state.feedback?.status === 'error') return 'incorrect';
  return 'selected';
}

function renderChoice(mission, draft) {
  if (mission.options[0].chart) {
    return `<div class="chart-options">${mission.options.map((option, index) => `<button class="choice-option chart-option ${optionState(mission, option.value)}" type="button" data-action="choice" data-value="${option.value}"><span class="choice-letter">${String.fromCharCode(65 + index)}</span>${miniChart(option.chart)}<span class="chart-option-label">${escapeHtml(option.label)}</span></button>`).join('')}</div>`;
  }
  if (mission.options[0].customer) {
    return `<div class="customer-cards">${mission.options.map((option) => `<button class="choice-option customer-card ${optionState(mission, option.value)}" type="button" data-action="choice" data-value="${option.value}"><span class="customer-name"><span class="customer-avatar">${option.customer.initial}</span>${escapeHtml(option.label)}</span><span class="rfm-values"><span>Recency<strong>${option.customer.recency}</strong></span><span>Frequency<strong>${option.customer.frequency}</strong></span><span>Monetary<strong>${option.customer.monetary}</strong></span></span></button>`).join('')}</div>`;
  }
  return `<div class="choice-grid">${mission.options.map((option, index) => `<button class="choice-option ${optionState(mission, option.value)}" type="button" data-action="choice" data-value="${option.value}"><span class="choice-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option.label)}</span></button>`).join('')}</div>`;
}

function renderSequence(mission, draft) {
  return `<p class="sequence-instruction">Click in order. Click a selected step again to remove it. ${draft.selected.length}/${mission.items.length} placed.</p><div class="sequence-list">${mission.items.map((item) => {
    const position = draft.selected.indexOf(item.id);
    return `<button class="sequence-item ${position >= 0 ? 'selected' : ''}" type="button" data-action="sequence" data-value="${item.id}"><span class="sequence-number">${position >= 0 ? position + 1 : '·'}</span><span class="sequence-text"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`;
  }).join('')}</div>`;
}

function renderMatrix(mission, draft) {
  const columns = mission.rows[0].length;
  return `<div class="array-wrap"><div class="array-grid" style="grid-template-columns:38px repeat(${columns}, 74px)"><span></span>${Array.from({ length: columns }, (_, index) => `<span class="array-axis">col ${index}</span>`).join('')}${mission.rows.map((row, rowIndex) => `<span class="array-axis">row ${rowIndex}</span>${row.map((value, columnIndex) => {
    const key = `${rowIndex}-${columnIndex}`;
    return `<button class="array-cell ${draft.selected.includes(key) ? 'selected' : ''}" type="button" data-action="toggle-selection" data-value="${key}" aria-pressed="${draft.selected.includes(key)}">${value}</button>`;
  }).join('')}`).join('')}</div></div><p class="interaction-note">${icon('info', 'icon-sm')}Selected cells turn purple. You can change your selection before checking.</p>`;
}

function renderSelectableRows(mission, draft) {
  return `<div class="data-table-wrapper"><table class="data-table selectable"><thead><tr><th></th>${mission.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${mission.rowsData.map((row, index) => {
    const selected = draft.selected.includes(String(index));
    return `<tr class="${selected ? 'selected' : ''}" data-action="toggle-selection" data-value="${index}"><td><span class="row-selector">${icon('check', 'icon-sm')}</span></td>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div><p class="interaction-note">${icon('info', 'icon-sm')}Click a row to flag it for attention. Selected rows turn orange.</p>`;
}

function renderNumeric(mission, draft) {
  return `${renderDataTable(mission)}<div class="numeric-answer"><input class="number-input" type="number" step="any" inputmode="decimal" data-input="numeric" value="${escapeHtml(draft.value)}" aria-label="Your numerical answer" placeholder="Your answer">${mission.suffix ? `<span class="input-suffix">${escapeHtml(mission.suffix)}</span>` : ''}</div>`;
}

function renderTuning(mission, draft) {
  const index = mission.depths.indexOf(Number(draft.value));
  return `<div class="slider-workspace"><label class="label" for="depth-slider">Decision-tree depth</label><div class="slider-label"><span>How complex should the tree be?</span><output id="depth-value" for="depth-slider">${draft.value}</output></div><input id="depth-slider" class="range-input" type="range" min="1" max="6" step="1" value="${draft.value}" data-input="tuning" aria-label="Decision-tree depth"><div class="range-labels"><span>Simple · may underfit</span><span>Complex · may overfit</span></div><div class="tuning-scores" id="tuning-scores">${renderTuningScores(mission, index)}</div><div class="tuning-plot" id="tuning-plot">${tuningChart(mission, draft.value)}</div></div>`;
}

function renderTuningScores(mission, index) {
  return `<div class="score-card"><span>Training accuracy</span><strong>${mission.training[index]}%</strong></div><div class="score-card best"><span>Validation accuracy</span><strong>${mission.validation[index]}%</strong></div>`;
}

function renderConfusionMatrix(metrics) {
  return `<div class="confusion-matrix"><span class="matrix-cell heading"></span><span class="matrix-cell heading">Predicted fraud</span><span class="matrix-cell heading">Predicted legitimate</span><span class="matrix-cell heading">Actual fraud</span><span class="matrix-cell positive"><strong>${metrics.tp}</strong>True positive</span><span class="matrix-cell negative"><strong>${metrics.fn}</strong>False negative</span><span class="matrix-cell heading">Actual legitimate</span><span class="matrix-cell negative"><strong>${metrics.fp}</strong>False positive</span><span class="matrix-cell positive"><strong>${metrics.tn}</strong>True negative</span></div>`;
}

function renderThresholdScores(metrics) {
  return `<div class="score-card ${metrics.precision >= 0.6 ? 'best' : ''}"><span>Precision</span><strong>${Math.round(metrics.precision * 100)}%</strong></div><div class="score-card ${metrics.recall >= 0.75 ? 'best' : ''}"><span>Recall</span><strong>${Math.round(metrics.recall * 100)}%</strong></div><div class="score-card"><span>Accuracy</span><strong>${Math.round(metrics.accuracy * 100)}%</strong></div>`;
}

function renderThreshold(mission, draft) {
  const metrics = calculateConfusion(mission.cases, Number(draft.value));
  return `<div class="slider-workspace"><label class="label" for="threshold-slider">Classification threshold</label><div class="slider-label"><span>Predict fraud when probability ≥</span><output id="threshold-value" for="threshold-slider">${Number(draft.value).toFixed(2)}</output></div><input id="threshold-slider" class="range-input" type="range" min="0.1" max="0.9" step="0.05" value="${draft.value}" data-input="threshold" aria-label="Fraud classification threshold"><div class="range-labels"><span>Catch more · more false alarms</span><span>Fewer alarms · miss more fraud</span></div><div class="threshold-scores" id="threshold-scores">${renderThresholdScores(metrics)}</div><div id="confusion-matrix">${renderConfusionMatrix(metrics)}</div><p class="interaction-note">Goal: precision ≥ 60% and recall ≥ 75%. Accuracy alone is not the goal.</p></div>`;
}

function renderMetrics(mission, draft) {
  return `${renderConfusionMatrix(mission.confusion)}<div class="metrics-inputs">${['precision', 'recall', 'f1'].map((metric) => `<div class="metric-input"><label for="${metric}-input">${metric === 'f1' ? 'F1 score' : metric[0].toUpperCase() + metric.slice(1)}</label><input id="${metric}-input" class="number-input" type="number" step="any" inputmode="decimal" data-input="metrics" data-field="${metric}" value="${escapeHtml(draft.values[metric])}" placeholder="0.00"></div>`).join('')}</div>`;
}

function renderEncoding(mission, draft) {
  return `<div class="encoding-wrap"><div class="encoding-grid" style="grid-template-columns:110px repeat(${mission.categories.length}, minmax(80px, 1fr))"><span></span>${mission.categories.map((category) => `<span class="encoding-cell encoding-header">${category}</span>`).join('')}${mission.values.map((value, rowIndex) => `<span class="encoding-cell encoding-row-label">Row ${rowIndex + 1}: ${value}</span>${mission.categories.map((category, columnIndex) => {
    const key = `${rowIndex}-${columnIndex}`;
    const selected = draft.selected.includes(key);
    return `<button class="encoding-cell ${selected ? 'selected' : ''}" type="button" data-action="toggle-selection" data-value="${key}" aria-label="Row ${rowIndex + 1}, ${category}" aria-pressed="${selected}">${selected ? 1 : 0}</button>`;
  }).join('')}`).join('')}</div></div><p class="interaction-note">${icon('info', 'icon-sm')}Click a cell to switch it between 0 and 1. Each row should encode its original category.</p>`;
}

function renderCodeResults(part) {
  const result = state.codeResults.get(part.id);
  if (!result) {
    return '<div class="empty-output">Your test results will appear here. You can run the tests as many times as you need.</div>';
  }
  return `<div class="code-result-banner ${result.passed ? 'passed' : 'failed'}">${icon(result.passed ? 'check' : 'x', 'icon-sm')}<span>${escapeHtml(result.message)}</span></div>${result.tests.length ? `<div class="test-list">${result.tests.map((test) => `<div class="test-result ${test.passed ? 'passed' : 'failed'}"><div>${icon(test.passed ? 'check' : 'x', 'icon-sm')}<strong>${escapeHtml(test.label)}</strong></div>${test.passed ? '' : `<pre>${escapeHtml(test.message)}</pre>`}</div>`).join('')}</div>` : ''}${result.output ? `<details class="printed-output"><summary>Printed output</summary><pre>${escapeHtml(result.output)}</pre></details>` : ''}`;
}

function renderCodeLab(mission) {
  const lab = mission.lab;
  const part = currentCodePart(mission);
  const code = currentCode(part);
  const passedCount = lab.parts.filter((item) => state.progress.codeParts.includes(item.id)).length;
  const solutionVisible = state.solutionVisibility.has(part.id);
  return `<div class="code-lab">
    <div class="homework-target"><div><span class="homework-target-label">${icon('target', 'icon-sm')}Homework target</span><strong>${escapeHtml(lab.homeworkName)}</strong><div class="skill-tags">${lab.alignment.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}</div></div><a class="button button-secondary" href="${lab.homeworkUrl}" target="_blank" rel="noopener">Official homework${icon('external', 'icon-sm')}</a></div>
    <div class="code-part-tabs" role="tablist" aria-label="Coding lab parts">${lab.parts.map((item, index) => {
      const passed = state.progress.codeParts.includes(item.id);
      return `<button class="code-part-tab ${index === selectedPartIndex(mission) ? 'active' : ''} ${passed ? 'done' : ''}" type="button" data-action="select-code-part" data-index="${index}" role="tab" aria-selected="${index === selectedPartIndex(mission)}" ${state.codeRunning ? 'disabled' : ''}><span>${passed ? icon('check', 'icon-sm') : index + 1}</span><strong>${escapeHtml(item.level)}</strong></button>`;
    }).join('')}</div>
    <div class="lab-part-progress"><span>${passedCount}/${lab.parts.length} functions passed</span><div class="progress-track"><div class="progress-fill" style="width:${(passedCount / lab.parts.length) * 100}%"></div></div></div>
    <section class="code-instruction" role="tabpanel"><div class="mission-label">${escapeHtml(part.level)} · Python function</div><h3>${escapeHtml(part.title)}</h3><p>${escapeHtml(part.instruction)}</p></section>
    <details class="setup-details"><summary>Provided setup and practice data ${icon('chevronDown', 'icon-sm')}</summary><p>These imports and datasets are already available when your function runs. Like the official homework, your function itself does not need import statements.</p><pre>${escapeHtml(lab.setup || '# No external packages are needed for this lab.')}</pre></details>
    <div class="editor-shell">
      <div class="editor-toolbar"><span class="editor-file">${icon('code', 'icon-sm')}main.py <span>Python</span></span><div class="editor-tools"><button type="button" data-action="copy-code">${icon('layers', 'icon-sm')}Copy code</button><button type="button" data-action="toggle-solution">${icon('lightbulb', 'icon-sm')}${solutionVisible ? 'Hide solution' : 'View solution'}</button></div></div>
      <div class="editor-wrap"><pre class="editor-lines" id="editor-lines" aria-hidden="true">${Array.from({ length: code.split('\n').length }, (_, index) => index + 1).join('\n')}</pre><textarea class="code-editor" id="python-editor" data-input="code" aria-label="Python code for ${escapeHtml(part.title)}" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" rows="${Math.max(10, code.split('\n').length + 2)}" ${state.codeRunning ? 'readonly' : ''}>${escapeHtml(code)}</textarea></div>
    </div>
    <div class="python-status" role="status"><span class="python-status-dot ${state.codeRunning ? 'running' : ''}"></span><span id="runtime-message">${state.codeRunning ? escapeHtml(state.runtimeMessage) : 'Python runs in your browser. The first run downloads the required packages; later runs are faster.'}</span></div>
    <div class="code-results" id="code-results" aria-live="polite">${renderCodeResults(part)}</div>
    ${solutionVisible ? `<div class="solution-panel"><div class="solution-heading"><strong>${icon('lightbulb', 'icon-sm')}Worked solution</strong><button class="button button-secondary" type="button" data-action="use-solution">Use this solution</button></div><pre>${escapeHtml(part.solution)}</pre><p>${escapeHtml(part.explanation)}</p><span>Using the solution does not complete the task automatically. Run the tests and make sure you understand each line.</span></div>` : ''}
    <div class="homework-next"><span>${icon('rocket', 'icon-sm')}</span><div><strong>Ready for the real notebook?</strong><p>Pass all three functions, then open the official homework. Reuse the same logic on its full dataset and submit only the requested function—without imports or test code.</p></div></div>
  </div>`;
}

function renderVisual(mission) {
  if (!mission.visual) return '';
  return `<div class="exercise-visual"><div class="visual-title"><span>${mission.visual === 'cv' ? 'Validation result by fold' : 'Daily temperature versus rentals'}</span><span>${mission.visual === 'cv' ? 'Higher is better' : 'Each dot = one day'}</span></div>${mission.visual === 'cv' ? cvChart() : scatterChart()}</div>`;
}

function renderInteraction(mission, draft) {
  switch (mission.type) {
    case 'choice': return renderChoice(mission, draft);
    case 'sequence': return renderSequence(mission, draft);
    case 'matrix': return renderMatrix(mission, draft);
    case 'rows': return renderSelectableRows(mission, draft);
    case 'numeric': return renderNumeric(mission, draft);
    case 'tuning': return renderTuning(mission, draft);
    case 'threshold': return renderThreshold(mission, draft);
    case 'metrics': return renderMetrics(mission, draft);
    case 'encoding': return renderEncoding(mission, draft);
    case 'code': return renderCodeLab(mission);
    default: return '';
  }
}

function renderFeedback() {
  if (!state.feedback) return '';
  const success = state.feedback.status === 'success';
  return `<div class="feedback ${success ? 'success' : 'error'}" role="status" aria-live="polite"><span class="feedback-icon">${icon(success ? 'check' : 'x', 'icon-sm')}</span><div><h3>${success ? 'Nice work—that’s correct!' : 'Not quite yet. Keep experimenting.'}</h3><p>${escapeHtml(state.feedback.text)}</p></div></div>`;
}

function renderNextRow(session, mission) {
  if (state.feedback?.status !== 'success') return '';
  const index = session.missions.findIndex((item) => item.id === mission.id);
  const nextMission = [...session.missions.slice(index + 1), ...session.missions.slice(0, index)]
    .find((item) => !state.progress.completed.includes(item.id));
  if (nextMission) {
    return `<div class="next-row"><div><h3>${mission.type === 'code' ? 'Coding lab complete—keep going.' : 'Mission complete. Keep the momentum.'}</h3><p>${completedCount(session)}/${session.missions.length} in this session · Up next: ${escapeHtml(nextMission.title)}</p></div><button class="button" type="button" data-action="next-mission">Next unfinished mission${icon('arrowRight')}</button></div>`;
  }
  const nextSession = getSession(session.id + 1);
  return `<div class="next-row"><div><h3>You completed Session ${session.id}!</h3><p>${nextSession ? `Next: ${escapeHtml(nextSession.shortTitle)}` : 'You completed the full Sessions 1–9 learning path.'}</p></div><button class="button" type="button" data-action="next-session">${nextSession ? `Start Session ${nextSession.id}` : 'View my progress'}${icon(nextSession ? 'arrowRight' : 'trophy')}</button></div>`;
}

function renderConfetti() {
  if (!state.justCompleted) return '';
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, index) => `<i style="--x:${4 + index * 5.3}%;--delay:${(index % 6) * 0.08}s"></i>`).join('')}</div>`;
}

function renderSessionPage() {
  const session = currentSession();
  const mission = currentMission();
  const draft = getDraft(mission);
  const complete = completedCount(session);
  const missionIndex = session.missions.findIndex((item) => item.id === mission.id);
  return `
    <main class="container session-page">
      <div class="breadcrumbs"><button class="breadcrumb-button" type="button" data-action="home">Home</button><span>/</span><button class="breadcrumb-button" type="button" data-action="curriculum">Curriculum</button><span>/</span><span>Session ${session.id}</span></div>
      <section class="session-banner" style="--accent:${session.color};--accent-soft:${session.soft}">
        <div class="banner-heading"><span class="session-icon">${icon(session.icon)}</span><div><h1>${escapeHtml(session.shortTitle)}</h1><p>Session ${session.id} · ${escapeHtml(session.description)}</p></div></div>
        <div class="banner-actions"><a class="button button-ghost" href="${session.source}" target="_blank" rel="noopener">Course files${icon('external', 'icon-sm')}</a><div class="session-progress-label"><strong>${complete}/${session.missions.length} complete</strong><div class="progress-track"><div class="progress-fill" style="width:${(complete / session.missions.length) * 100}%;background:${session.color}"></div></div></div></div>
      </section>
      <div class="learning-layout">
        ${renderSidebar(session)}
        <section class="exercise-column">
          <article class="exercise-card">
            ${renderConfetti()}
            <header class="exercise-header"><div><div class="mission-label">Mission ${missionIndex + 1} of ${session.missions.length} · ${escapeHtml(mission.subtitle)}</div><h2>${escapeHtml(mission.title)}</h2><p>${escapeHtml(mission.brief)}</p></div><span class="xp-badge">${icon('sparkles', 'icon-sm')}+${mission.xp} XP</span></header>
            ${renderLesson(mission)}
            <div class="exercise-body"><h3 class="task-heading">${icon('target', 'icon-sm')}Your mission</h3><p class="task-description">${escapeHtml(mission.task)}</p>${mission.code ? `<div class="code-block">${escapeHtml(mission.code)}</div>` : ''}${renderVisual(mission)}<div id="exercise-interaction">${renderInteraction(mission, draft)}</div></div>
            ${state.showHint ? `<div class="hint-box"><strong>A gentle hint:</strong> ${escapeHtml(mission.type === 'code' ? currentCodePart(mission).hint : mission.hint)}</div>` : ''}
            ${renderFeedback()}
            <footer class="exercise-footer"><div class="footer-tools"><button class="button button-ghost" type="button" data-action="toggle-hint">${icon('lightbulb', 'icon-sm')}${state.showHint ? 'Hide hint' : 'Need a hint?'}</button><button class="button button-ghost" type="button" data-action="reset-answer">${icon('reset', 'icon-sm')}${mission.type === 'code' ? 'Reset part' : 'Reset'}</button></div><button class="button button-primary" type="button" data-action="check-answer" ${hasAnswer(mission, draft) && !state.codeRunning ? '' : 'disabled'}>${mission.type === 'code' ? (state.codeRunning ? 'Running tests…' : 'Run tests') : 'Check answer'}${icon('arrowRight', 'icon-sm')}</button></footer>
          </article>
          ${renderNextRow(session, mission)}
        </section>
      </div>
    </main>`;
}

function renderProgressModal() {
  if (state.modal !== 'progress') return '';
  const count = state.progress.completed.length;
  const percent = Math.round((count / totalMissions) * 100);
  return `<div class="modal-backdrop"><section class="progress-modal" role="dialog" aria-modal="true" aria-labelledby="progress-title"><div class="modal-header"><div><h2 id="progress-title">Your learning journey</h2><p>Small wins add up. Your progress is saved locally.</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close progress">${icon('x')}</button></div><div class="progress-hero"><div class="large-ring" style="--progress:${percent * 3.6}deg"><strong>${percent}%</strong></div><div><h3>${count === totalMissions ? 'Learning path complete!' : count === 0 ? 'Your first mission awaits' : 'You’re building real skills'}</h3><p>${count} of ${totalMissions} missions · ${earnedXp().toLocaleString()} XP earned</p></div></div><div class="progress-session-list">${sessions.map((session) => `<button class="progress-session" type="button" data-action="open-session" data-session="${session.id}"><span class="progress-session-number">${session.id}</span><span class="progress-session-title">${escapeHtml(session.shortTitle)}</span><span class="progress-session-count">${completedCount(session)}/${session.missions.length} ${completedCount(session) === session.missions.length ? '✓' : ''}</span></button>`).join('')}</div><div class="reset-area">${state.confirmReset ? `<div class="reset-confirm"><p>Reset all ${count} completed missions and ${earnedXp().toLocaleString()} XP? This cannot be undone.</p><button class="button button-dark" type="button" data-action="reset-progress">Yes, reset everything</button> <button class="button button-ghost" type="button" data-action="cancel-reset">Keep my progress</button></div>` : `<button class="reset-button" type="button" data-action="confirm-reset">Reset learning progress</button>`}</div></section></div>`;
}

function renderToast() {
  if (!state.toast) return '';
  return `<div class="toast" role="status">${icon('info', 'icon-sm')}${escapeHtml(state.toast)}<button class="icon-button" type="button" data-action="dismiss-toast" aria-label="Dismiss">${icon('x', 'icon-sm')}</button></div>`;
}

function renderApp() {
  app.innerHTML = `${renderHeader()}${state.view === 'home' ? renderHome() : renderSessionPage()}${renderProgressModal()}${renderToast()}`;
  document.body.style.overflow = state.modal ? 'hidden' : '';
}

async function runCurrentCodePart() {
  const mission = currentMission();
  if (mission.type !== 'code' || state.codeRunning) return;
  const part = currentCodePart(mission);
  const code = currentCode(part);
  const runVersion = ++state.codeRunVersion;
  state.codeRunning = true;
  state.runtimeMessage = 'Starting Python…';
  state.feedback = null;
  state.justCompleted = false;
  renderApp();

  try {
    const result = await runPythonPart(mission.lab, part, code, (message) => {
      state.runtimeMessage = message;
      const status = document.querySelector('#runtime-message');
      if (status) status.textContent = message;
    });
    if (runVersion !== state.codeRunVersion) return;
    state.codeResults.set(part.id, result);
    if (result.passed) {
      const newPart = !state.progress.codeParts.includes(part.id);
      if (newPart) state.progress.codeParts.push(part.id);
      const labComplete = mission.lab.parts.every((item) => state.progress.codeParts.includes(item.id));
      const newMission = labComplete && !state.progress.completed.includes(mission.id);
      if (newMission) state.progress.completed.push(mission.id);
      if (newPart || newMission) {
        const saved = saveProgress(state.progress);
        if (!saved) state.toast = 'Your browser could not save progress. Keep this tab open.';
      }
      state.justCompleted = newMission && state.missionId === mission.id;
      if (labComplete && state.missionId === mission.id) {
        state.feedback = { status: 'success', text: mission.explanation };
      }
    }
  } catch (error) {
    state.codeResults.set(part.id, {
      passed: false,
      tests: [],
      output: '',
      message: `The test runner stopped unexpectedly. Please try again.\n${error.message || error}`,
    });
  } finally {
    if (runVersion === state.codeRunVersion) {
      state.codeRunning = false;
      state.runtimeMessage = '';
      renderApp();
    }
  }
}

function checkAnswer() {
  const mission = currentMission();
  if (mission.type === 'code') {
    void runCurrentCodePart();
    return;
  }
  const draft = getDraft(mission);
  if (!hasAnswer(mission, draft)) return;
  const result = evaluateMission(mission, draft);
  if (result.correct) {
    const isNew = !state.progress.completed.includes(mission.id);
    if (isNew) {
      state.progress.completed.push(mission.id);
      const saved = saveProgress(state.progress);
      if (!saved) state.toast = 'Your browser could not save progress. Keep this tab open.';
    }
    state.justCompleted = isNew;
    state.feedback = { status: 'success', text: `${result.detail ? `${result.detail} ` : ''}${mission.explanation}` };
  } else {
    state.justCompleted = false;
    state.feedback = { status: 'error', text: `${result.detail ? `${result.detail} ` : ''}${mission.retry}` };
  }
  renderApp();
}

function clearLiveFeedback() {
  state.feedback = null;
  state.justCompleted = false;
  document.querySelector('.feedback')?.remove();
  document.querySelector('.next-row')?.remove();
}

function updateLiveWorkspace(mission) {
  const draft = getDraft(mission);
  if (mission.type === 'tuning') {
    const index = mission.depths.indexOf(Number(draft.value));
    document.querySelector('#depth-value').textContent = draft.value;
    document.querySelector('#tuning-scores').innerHTML = renderTuningScores(mission, index);
    document.querySelector('#tuning-plot').innerHTML = tuningChart(mission, draft.value);
  } else if (mission.type === 'threshold') {
    const metrics = calculateConfusion(mission.cases, Number(draft.value));
    document.querySelector('#threshold-value').textContent = Number(draft.value).toFixed(2);
    document.querySelector('#threshold-scores').innerHTML = renderThresholdScores(metrics);
    document.querySelector('#confusion-matrix').innerHTML = renderConfusionMatrix(metrics);
  }
}

app.addEventListener('click', (event) => {
  const element = event.target.closest('[data-action]');
  if (!element) {
    if (event.target.classList.contains('modal-backdrop')) {
      state.modal = null;
      renderApp();
    }
    return;
  }
  const action = element.dataset.action;
  const mission = state.view === 'session' ? currentMission() : null;

  switch (action) {
    case 'home':
      goHome();
      break;
    case 'curriculum':
      goHome(true);
      break;
    case 'continue': {
      const target = nextLearningTarget();
      if (target) navigate(target.session.id, target.mission.id);
      else {
        state.modal = 'progress';
        renderApp();
      }
      break;
    }
    case 'open-session': {
      const session = getSession(element.dataset.session);
      const nextMission = session.missions.find((item) => !state.progress.completed.includes(item.id)) || session.missions[0];
      navigate(session.id, nextMission.id);
      break;
    }
    case 'open-mission':
      navigate(element.dataset.session, element.dataset.mission);
      break;
    case 'toggle-lesson':
      state.lessonOpen = !state.lessonOpen;
      renderApp();
      break;
    case 'toggle-hint':
      state.showHint = !state.showHint;
      renderApp();
      break;
    case 'choice': {
      const draft = getDraft(mission);
      draft.value = element.dataset.value;
      state.feedback = null;
      state.justCompleted = false;
      renderApp();
      break;
    }
    case 'sequence': {
      const draft = getDraft(mission);
      const position = draft.selected.indexOf(element.dataset.value);
      if (position >= 0) draft.selected.splice(position, 1);
      else draft.selected.push(element.dataset.value);
      state.feedback = null;
      state.justCompleted = false;
      renderApp();
      break;
    }
    case 'toggle-selection': {
      const draft = getDraft(mission);
      const value = element.dataset.value;
      const position = draft.selected.indexOf(value);
      if (position >= 0) draft.selected.splice(position, 1);
      else draft.selected.push(value);
      state.feedback = null;
      state.justCompleted = false;
      renderApp();
      break;
    }
    case 'reset-answer':
      if (mission.type === 'code') {
        const part = currentCodePart(mission);
        state.codeDrafts[part.id] = part.starter;
        state.codeResults.delete(part.id);
        state.solutionVisibility.delete(part.id);
        persistCodeDrafts();
      } else {
        state.drafts.delete(mission.id);
      }
      state.feedback = null;
      state.showHint = false;
      state.justCompleted = false;
      renderApp();
      break;
    case 'select-code-part':
      if (!state.codeRunning) {
        state.labSelections.set(mission.id, Number(element.dataset.index));
        state.feedback = null;
        state.showHint = false;
        state.justCompleted = false;
        renderApp();
      }
      break;
    case 'toggle-solution': {
      const part = currentCodePart(mission);
      if (state.solutionVisibility.has(part.id)) state.solutionVisibility.delete(part.id);
      else state.solutionVisibility.add(part.id);
      renderApp();
      break;
    }
    case 'use-solution': {
      const part = currentCodePart(mission);
      state.codeDrafts[part.id] = part.solution;
      state.codeResults.delete(part.id);
      state.feedback = null;
      state.justCompleted = false;
      persistCodeDrafts();
      renderApp();
      break;
    }
    case 'copy-code': {
      const part = currentCodePart(mission);
      navigator.clipboard.writeText(currentCode(part)).then(() => {
        state.toast = 'Current Python function copied. You can paste it into your notebook.';
        renderApp();
      }).catch(() => {
        state.toast = 'Copy failed. Select the code in the editor and copy it manually.';
        renderApp();
      });
      break;
    }
    case 'check-answer':
      checkAnswer();
      break;
    case 'next-mission': {
      const session = currentSession();
      const index = session.missions.findIndex((item) => item.id === mission.id);
      const nextMission = [...session.missions.slice(index + 1), ...session.missions.slice(0, index)]
        .find((item) => !state.progress.completed.includes(item.id));
      if (nextMission) navigate(session.id, nextMission.id);
      break;
    }
    case 'next-session': {
      const next = getSession(currentSession().id + 1);
      if (next) navigate(next.id, next.missions[0].id);
      else {
        state.modal = 'progress';
        renderApp();
      }
      break;
    }
    case 'progress':
      state.modal = 'progress';
      state.confirmReset = false;
      renderApp();
      requestAnimationFrame(() => document.querySelector('.progress-modal .icon-button')?.focus());
      break;
    case 'close-modal':
      state.modal = null;
      renderApp();
      break;
    case 'confirm-reset':
      state.confirmReset = true;
      renderApp();
      break;
    case 'cancel-reset':
      state.confirmReset = false;
      renderApp();
      break;
    case 'reset-progress':
      clearProgress();
      state.progress = { completed: [], codeParts: [] };
      state.drafts.clear();
      state.codeDrafts = {};
      state.codeResults.clear();
      state.labSelections.clear();
      state.solutionVisibility.clear();
      state.codeRunVersion += 1;
      state.codeRunning = false;
      persistCodeDrafts();
      state.modal = null;
      state.confirmReset = false;
      state.feedback = null;
      state.justCompleted = false;
      state.toast = 'Progress and code drafts reset. A fresh learning journey starts now.';
      renderApp();
      break;
    case 'dismiss-toast':
      state.toast = null;
      renderApp();
      break;
  }
});

app.addEventListener('input', (event) => {
  const input = event.target.closest('[data-input]');
  if (!input || state.view !== 'session') return;
  const mission = currentMission();
  const draft = getDraft(mission);
  switch (input.dataset.input) {
    case 'numeric':
      draft.value = input.value;
      clearLiveFeedback();
      break;
    case 'metrics':
      draft.values[input.dataset.field] = input.value;
      clearLiveFeedback();
      break;
    case 'code': {
      const part = currentCodePart(mission);
      state.codeDrafts[part.id] = input.value;
      state.codeResults.delete(part.id);
      persistCodeDrafts();
      clearLiveFeedback();
      const lineNumbers = document.querySelector('#editor-lines');
      if (lineNumbers) {
        lineNumbers.textContent = Array.from({ length: input.value.split('\n').length }, (_, index) => index + 1).join('\n');
        lineNumbers.scrollTop = input.scrollTop;
      }
      input.rows = Math.max(10, input.value.split('\n').length + 2);
      const results = document.querySelector('#code-results');
      if (results) results.innerHTML = '<div class="empty-output">Code changed. Run the tests to check this version.</div>';
      break;
    }
    case 'tuning':
    case 'threshold':
      draft.value = Number(input.value);
      clearLiveFeedback();
      updateLiveWorkspace(mission);
      break;
  }
  const checkButton = document.querySelector('[data-action="check-answer"]');
  if (checkButton) checkButton.disabled = !hasAnswer(mission, draft);
});

app.addEventListener('keydown', (event) => {
  if (event.target.matches('.code-editor')) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const editor = event.target;
      editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void runCurrentCodePart();
    }
    return;
  }
  if (event.key === 'Enter' && event.target.matches('.number-input')) {
    event.preventDefault();
    checkAnswer();
  }
});

app.addEventListener('scroll', (event) => {
  if (event.target.matches('.code-editor')) {
    const lineNumbers = document.querySelector('#editor-lines');
    if (lineNumbers) lineNumbers.scrollTop = event.target.scrollTop;
  }
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.modal) {
    state.modal = null;
    renderApp();
  }
});

window.addEventListener('hashchange', () => {
  const match = window.location.hash.match(/^#session\/(\d+)\/([\w-]+)$/);
  if (match) openMission(Number(match[1]), match[2]);
  else goHome();
});

const initialRoute = window.location.hash.match(/^#session\/(\d+)\/([\w-]+)$/);
if (initialRoute && getSession(initialRoute[1])) {
  openMission(Number(initialRoute[1]), initialRoute[2]);
} else {
  renderApp();
}
