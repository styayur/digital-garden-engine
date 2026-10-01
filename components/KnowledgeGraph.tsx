'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';

import { GARDEN_EDGES, GARDEN_NODES } from '@/lib/garden';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * A small knowledge network rendered as SVG.
 * Hovering a node traces its paths to the neighbouring provinces.
 *
 * Positioning lives on a plain <g transform>, while a nested motion group
 * handles the entrance/hover animation — keeping the two independent.
 */
export function KnowledgeGraph() {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(GARDEN_NODES.map((node) => [node.id, node])),
    [],
  );

  const neighbors = useMemo(() => {
    const set = new Set<string>();
    if (!activeId) return set;
    for (const edge of GARDEN_EDGES) {
      if (edge.source === activeId) set.add(edge.target);
      if (edge.target === activeId) set.add(edge.source);
    }
    return set;
  }, [activeId]);

  const activeNode = activeId ? byId.get(activeId) : undefined;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line/80 bg-surface/40">
        <svg
          viewBox="0 0 780 460"
          className="h-auto w-full"
          role="img"
          aria-label="A knowledge graph connecting AI, Programming, Literature, Philosophy, Systems and Cognition"
        >
          <defs>
            <radialGradient id="kg-glow" cx="50%" cy="46%" r="55%">
              <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.07" />
              <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="780" height="460" fill="url(#kg-glow)" />

          {/* paths between provinces */}
          {GARDEN_EDGES.map((edge) => {
            const a = byId.get(edge.source);
            const b = byId.get(edge.target);
            if (!a || !b) return null;
            const isActive =
              activeId !== null &&
              (edge.source === activeId || edge.target === activeId);
            const isDimmed = activeId !== null && !isActive;
            return (
              <motion.line
                key={`${edge.source}-${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: isDimmed ? 0.06 : isActive ? 0.9 : 0.32 }}
                transition={{ duration: 0.45, delay: reduce ? 0 : 0.5 }}
                style={{
                  stroke: isActive ? 'rgb(var(--accent))' : 'rgb(var(--muted))',
                  strokeWidth: isActive ? 1.4 : 1,
                }}
              />
            );
          })}

          {/* provinces */}
          {GARDEN_NODES.map((node, i) => {
            const isActive = node.id === activeId;
            const isDimmed =
              activeId !== null && !isActive && !neighbors.has(node.id);
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <motion.g
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveId(node.id)}
                  onMouseLeave={() => setActiveId(null)}
                  initial={reduce ? false : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: isDimmed ? 0.18 : 1, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: reduce ? 0 : 0.12 + i * 0.06,
                    ease: EASE,
                  }}
                >
                  <motion.circle
                    animate={{ r: isActive ? 34 : 25 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    style={{
                      fill: isActive
                        ? 'rgb(var(--accent-soft))'
                        : 'rgb(var(--surface))',
                      stroke: isActive
                        ? 'rgb(var(--accent))'
                        : 'rgb(var(--line))',
                      strokeWidth: 1.2,
                    }}
                  />
                  <text
                    y={5}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: isActive ? 19 : 15,
                      fill: isActive ? 'rgb(var(--accent))' : 'rgb(var(--ink))',
                      pointerEvents: 'none',
                    }}
                  >
                    {node.label}
                  </text>
                  <text
                    y={isActive ? 52 : 46}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8.5,
                      letterSpacing: '0.16em',
                      fill: isActive ? 'rgb(var(--accent))' : 'rgb(var(--faint))',
                      pointerEvents: 'none',
                    }}
                  >
                    {node.note.toUpperCase()}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        {activeNode
          ? `${activeNode.label} — ${activeNode.note}. paths to ${[...neighbors].join(' · ')}`
          : 'Six provinces, one garden — hover to trace the paths between them'}
      </p>
    </div>
  );
}