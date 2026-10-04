const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { randomUUID } = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MAX_CODE = 50_000;
const MAX_INPUT = 10_000;
const TIMEOUT_MS = 5_000;

const LANGUAGES = {
  javascript: { name: 'JavaScript (Node.js)', extension: '.js' },
  python: { name: 'Python 3', extension: '.py' },
  java: { name: 'Java', extension: '.java' },
  cpp: { name: 'C++', extension: '.cpp' }
};

const DEFAULT_CODE = {
  javascript: `const name = require('fs').readFileSync(0, 'utf8').trim() || 'World';\nconsole.log(\`Hello, \${name}!\`);`,
  python: `import sys\nname = sys.stdin.readline().strip() or "World"\nprint(f"Hello, {name}!")`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.hasNextLine() ? sc.nextLine() : "World";\n        System.out.println("Hello, " + name + "!");\n    }\n}`,
  cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    getline(cin, name);\n    if (name.empty()) name = "World";\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}`
};

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Online Code Editor API', execution: 'local' });
});

app.get('/api/languages', (_req, res) => {
  res.json(LANGUAGES);
});

function runProcess(command, args, input, cwd, timeout = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const started = process.hrtime.bigint();
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeout);

    child.on('error', error => {
      clearTimeout(timer);
      resolve({
        ok: false,
        stdout,
        stderr: error.code === 'ENOENT'
          ? `Required runtime/compiler not found: ${command}. Install it and make sure it is available in PATH.`
          : error.message,
        timedOut: false,
        time: Number(process.hrtime.bigint() - started) / 1e9
      });
    });

    child.on('close', code => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        exitCode: code,
        stdout,
        stderr,
        timedOut,
        time: Number(process.hrtime.bigint() - started) / 1e9
      });
    });

    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

async function executeJavaScript(code, input, dir) {
  const file = path.join(dir, 'Main.js');
  await fs.writeFile(file, code, 'utf8');
  return runProcess(process.execPath, [file], input, dir);
}

async function executePython(code, input, dir) {
  const file = path.join(dir, 'Main.py');
  await fs.writeFile(file, code, 'utf8');
  const command = process.platform === 'win32' ? 'python' : 'python3';
  return runProcess(command, [file], input, dir);
}

async function executeJava(code, input, dir) {
  const file = path.join(dir, 'Main.java');
  await fs.writeFile(file, code, 'utf8');
  const compile = await runProcess('javac', [file], '', dir, TIMEOUT_MS);
  if (!compile.ok) return { ...compile, phase: 'compile' };
  return runProcess('java', ['-cp', dir, 'Main'], input, dir);
}

async function executeCpp(code, input, dir) {
  const source = path.join(dir, 'Main.cpp');
  const output = path.join(dir, process.platform === 'win32' ? 'Main.exe' : 'Main');
  await fs.writeFile(source, code, 'utf8');
  const compile = await runProcess('g++', ['-std=c++17', source, '-o', output], '', dir, TIMEOUT_MS);
  if (!compile.ok) return { ...compile, phase: 'compile' };
  return runProcess(output, [], input, dir);
}

app.post('/api/execute', async (req, res) => {
  const { code, language, input = '' } = req.body || {};

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Code cannot be empty.' });
  }
  if (!LANGUAGES[language]) {
    return res.status(400).json({ error: 'Unsupported language.' });
  }
  if (code.length > MAX_CODE) {
    return res.status(400).json({ error: 'Code is too large. Maximum size is 50 KB.' });
  }
  if (typeof input !== 'string' || input.length > MAX_INPUT) {
    return res.status(400).json({ error: 'Input is too large. Maximum size is 10 KB.' });
  }

  const dir = path.join(os.tmpdir(), `codeforge-${randomUUID()}`);

  try {
    await fs.mkdir(dir, { recursive: true });
    let result;

    if (language === 'javascript') result = await executeJavaScript(code, input, dir);
    if (language === 'python') result = await executePython(code, input, dir);
    if (language === 'java') result = await executeJava(code, input, dir);
    if (language === 'cpp') result = await executeCpp(code, input, dir);

    const status = result.timedOut
      ? 'Time Limit Exceeded'
      : result.phase === 'compile'
        ? 'Compilation Error'
        : result.ok
          ? 'Completed'
          : 'Runtime Error';

    res.json({
      status,
      output: result.stdout || '',
      error: result.stderr || '',
      time: Number(result.time.toFixed(3)),
      memory: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Execution failed: ' + error.message });
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`Online Code Editor API running on http://localhost:${PORT}`);
  console.log('Execution mode: local (no Judge0 API key required)');
});
