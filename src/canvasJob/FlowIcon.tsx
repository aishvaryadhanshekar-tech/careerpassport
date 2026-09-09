/** Shared visual vocabulary for canvas objects and their creation tools. */
export function FlowIcon({kind}:{kind:string}) {
  const paths:Record<string,string>={
    job:'M8 6V4h8v2 M4 7h16v13H4z M4 11h16 M10 11v3h4v-3',
    stage:'M5 5h14v14H5z M8 9h8 M8 13h5',
    round:'M12 3l9 9-9 9-9-9z M8 12l3 3 5-6',
    application:'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h5',
    trip:'M4 5l5-2 6 2 5-2v16l-5 2-6-2-5 2z M9 3v16 M15 5v16',
    communication:'M3 6h18v13H3z M3 7l9 7 9-7',
    capability:'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6'
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]||paths.stage}/></svg>;
}
