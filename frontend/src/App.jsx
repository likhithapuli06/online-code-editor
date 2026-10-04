import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Code2, Terminal, Clock3, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

const configs = {
  javascript: {
    label: 'JavaScript', mode: 'ace/mode/javascript', starter: `const name = require('fs').readFileSync(0, 'utf8').trim() || 'World';\nconsole.log(\`Hello, \${name}!\`);`,
  },
  python: {
    label: 'Python', mode: 'ace/mode/python', starter: `import sys\nname = sys.stdin.readline().strip() or "World"\nprint(f"Hello, {name}!")`,
  },
  java: {
    label: 'Java', mode: 'ace/mode/java', starter: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.hasNextLine() ? sc.nextLine() : "World";\n        System.out.println("Hello, " + name + "!");\n    }\n}`,
  },
  cpp: {
    label: 'C++', mode: 'ace/mode/c_cpp', starter: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    getline(cin, name);\n    if (name.empty()) name = "World";\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}`,
  }
};

function App() {
  const editorRef = useRef(null);
  const aceEditor = useRef(null);
  const [language, setLanguage] = useState('javascript');
  const [input, setInput] = useState('Alice');
  const [output, setOutput] = useState('Run your code to see the output here.');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Ready');
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ time: null, memory: null });

  useEffect(() => {
    if (!window.ace || !editorRef.current) return;
    window.ace.config.set('basePath', '/ace');
    const editor = window.ace.edit(editorRef.current);
    editor.setTheme('ace/theme/monokai');
    editor.session.setMode(configs.javascript.mode);
    editor.setValue(configs.javascript.starter, -1);
    editor.setOptions({
      fontSize: '15px',
      showPrintMargin: false,
      tabSize: 4,
      useSoftTabs: true,
      wrap: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
    });
    aceEditor.current = editor;
    return () => editor.destroy();
  }, []);

  const changeLanguage = (next) => {
    setLanguage(next);
    const config = configs[next];
    aceEditor.current?.session.setMode(config.mode);
    aceEditor.current?.setValue(config.starter, -1);
    setOutput('Run your code to see the output here.');
    setError('');
    setStatus('Ready');
    setMetrics({ time: null, memory: null });
  };

  const resetCode = () => {
    aceEditor.current?.setValue(configs[language].starter, -1);
    setInput('Alice');
    setOutput('Run your code to see the output here.');
    setError('');
    setStatus('Ready');
    setMetrics({ time: null, memory: null });
  };

  const runCode = async () => {
    const code = aceEditor.current?.getValue() || '';
    setRunning(true);
    setStatus('Running...');
    setOutput('');
    setError('');
    setMetrics({ time: null, memory: null });
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Execution failed.');
      setStatus(data.status || 'Completed');
      setOutput(data.output || 'No output.');
      setError(data.error || '');
      setMetrics({ time: data.time, memory: data.memory });
    } catch (err) {
      setStatus('Failed');
      setError(err.message);
      setOutput('');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-icon"><Code2 size={22} /></div><div><strong>CodeForge</strong><span>Online Code Editor</span></div></div>
        <div className="top-actions"><button className="reset-btn" onClick={resetCode}><RotateCcw size={16} /> Reset</button></div>
      </header>

      <main className="workspace">
        <section className="editor-card">
          <div className="toolbar">
            <div className="language-control"><label htmlFor="language">Language</label><select id="language" value={language} onChange={e => changeLanguage(e.target.value)}>{Object.entries(configs).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div>
            <button className="run-btn" onClick={runCode} disabled={running}><Play size={17} fill="currentColor" /> {running ? 'Running...' : 'Run Code'}</button>
          </div>
          <div className="editor-wrap"><div ref={editorRef} className="editor" /></div>
        </section>

        <aside className="side-panel">
          <section className="panel-card input-card"><div className="panel-heading"><div><span className="eyebrow">PROGRAM INPUT</span><h2>Custom Input</h2></div><Terminal size={19} /></div><textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter input for your program..." /></section>
          <section className="panel-card result-card"><div className="panel-heading"><div><span className="eyebrow">EXECUTION RESULT</span><h2>Output</h2></div><span className={`status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status === 'Completed' || status === 'Accepted' ? <CheckCircle2 size={14}/> : status === 'Failed' ? <AlertCircle size={14}/> : <span className="dot"/>}{status}</span></div><pre className="output">{output}</pre>{error && <pre className="error">{error}</pre>}<div className="metrics"><span><Clock3 size={14}/> {metrics.time != null ? `${metrics.time}s` : '—'}</span><span><HardDrive size={14}/> {metrics.memory != null ? `${metrics.memory} KB` : '—'}</span></div></section>
        </aside>
      </main>
      <footer>CodeForge • Built with React, Express and Ace Editor</footer>
    </div>
  );
}

export default App;
