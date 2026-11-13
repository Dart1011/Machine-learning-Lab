const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.8/full/';
let pyodidePromise;
const loadedPackages = new Set();

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const { loadPyodide } = await import(`${PYODIDE_URL}pyodide.mjs`);
      return loadPyodide({ indexURL: PYODIDE_URL });
    })();
  }
  try {
    return await pyodidePromise;
  } catch (error) {
    pyodidePromise = undefined;
    throw error;
  }
}

function readableError(error) {
  const lines = String(error?.message || error).trim().split('\n')
    .filter((line) => line.trim())
    .filter((line) => !line.includes('/lib/python') && !line.includes('coroutine = eval') && !/^[\s^]+$/.test(line));
  return lines.slice(-4).join('\n');
}

export async function runPythonPart(lab, part, code, onStatus = () => {}) {
  let pyodide;
  try {
    onStatus('Loading the Python runtime…');
    pyodide = await getPyodide();
    const missingPackages = lab.packages.filter((name) => !loadedPackages.has(name));
    if (missingPackages.length) {
      onStatus(`Loading ${missingPackages.join(', ')}…`);
      await pyodide.loadPackage(missingPackages);
      missingPackages.forEach((name) => loadedPackages.add(name));
    }
  } catch (error) {
    return {
      passed: false,
      tests: [],
      output: '',
      message: `Python could not start. Check your internet connection and try again.\n${readableError(error)}`,
    };
  }

  const printed = [];
  pyodide.setStdout({ batched: (line) => printed.push(line) });
  pyodide.setStderr({ batched: (line) => printed.push(line) });
  const globals = pyodide.runPython('{}');

  try {
    onStatus('Preparing the exercise data…');
    if (lab.setup) await pyodide.runPythonAsync(lab.setup, { globals });
    onStatus('Running your function…');
    await pyodide.runPythonAsync(code, { globals });

    const tests = [];
    for (const test of part.tests) {
      onStatus(`Running test: ${test.label}`);
      try {
        await pyodide.runPythonAsync(test.code, { globals });
        tests.push({ label: test.label, passed: true, message: 'Passed' });
      } catch (error) {
        tests.push({ label: test.label, passed: false, message: readableError(error) });
      }
    }
    const passed = tests.every((test) => test.passed);
    return {
      passed,
      tests,
      output: printed.join('\n'),
      message: passed ? 'All tests passed. This function is ready.' : 'Some tests need another look. Read the first failure, edit your code, and run again.',
    };
  } catch (error) {
    return {
      passed: false,
      tests: [],
      output: printed.join('\n'),
      message: `Your code could not run yet:\n${readableError(error)}`,
    };
  } finally {
    globals.destroy();
  }
}
