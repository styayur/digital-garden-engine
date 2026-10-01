'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

type LineKind = 'sys' | 'cmd' | 'out';

interface Line {
  kind: LineKind;
  text: string;
}

interface TerminalProps {
  user: string;
  host: string;
  about: string;
  role: string;
}

const HELP = [
  'available commands',
  '  about       who is behind this garden',
  '  projects    open the project index',
  '  writing     open the essay index',
  '  library     open the reading shelves',
  '  garden      open the knowledge graph',
  '  now         read the current state',
  '  whoami      show the prompt identity',
  '  date        show the current date',
  '  clear       clear the screen',
  '  help        show this message',
];

function runCommand(command: string, props: TerminalProps): string[] {
  const cmd = command.trim().toLowerCase();

  switch (cmd) {
    case 'help':
      return HELP;
    case 'about':
      return [props.about, props.role, '', '→ open /about in the browser'];
    case 'projects':
      return ['The project index is generated from published project entries.', '', '→ open /projects in the browser'];
    case 'writing':
      return ['The writing index is generated from published essays.', '', '→ open /writing in the browser'];
    case 'library':
      return ['The library contains books, notes and quotes.', '', '→ open /library in the browser'];
    case 'garden':
      return ['Six sample provinces, one garden:', 'AI · Programming · Literature · Philosophy · Systems · Cognition', '', '→ open /garden in the browser'];
    case 'now':
      return ['A short snapshot of current work and reading.', '', '→ open /now in the browser'];
    case 'whoami':
      return [`${props.user}@${props.host} — tending a small digital garden.`];
    case 'date':
      return [new Date().toUTCString()];
    case 'exit':
      return ['session closed.', 'the garden is still open — see you there.'];
    default:
      return [`command not found: ${command}`, "type 'help' to list the commands"];
  }
}

export function Terminal({ user, host, about, role }: TerminalProps) {
  const prompt = `${user}@${host}:~$`;
  const [lines, setLines] = useState<Line[]>([
    { kind: 'sys', text: `${user}@${host} — digital garden terminal` },
    { kind: 'sys', text: "type 'help' to begin" },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const command = input.trim();
    if (!command) return;

    if (command.toLowerCase() === 'clear') {
      setLines([]);
      setInput('');
      return;
    }

    const output = runCommand(command, { user, host, about, role });
    setLines((previous) => [
      ...previous,
      { kind: 'cmd', text: command },
      ...output.map((text) => ({ kind: 'out' as const, text })),
    ]);
    setHistory((previous) => [...previous, command]);
    setHistoryIndex(-1);
    setInput('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const index = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      if (history[index] !== undefined) {
        setHistoryIndex(index);
        setInput(history[index]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === -1) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setInput('');
        return;
      }
      setHistoryIndex(next);
      setInput(history[next]);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/10">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-[11px] text-faint">{prompt}</span>
      </div>
      <div
        className="h-[360px] overflow-y-auto p-5 font-mono text-[13px] leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, index) => (
          <div key={`${line.kind}-${index}`} className="whitespace-pre-wrap">
            {line.kind === 'cmd' ? <span className="text-accent">{prompt} </span> : null}
            <span className={line.kind === 'sys' ? 'text-faint' : 'text-muted'}>{line.text}</span>
          </div>
        ))}
        <form onSubmit={submit} className="mt-2 flex items-center">
          <span className="mr-2 shrink-0 text-accent">{prompt}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none"
            aria-label="Terminal command"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  );
}
