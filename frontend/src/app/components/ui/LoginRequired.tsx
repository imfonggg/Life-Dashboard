type LoginRequiredProps = {
  /** What the page was trying to load, e.g. "your tasks". */
  what: string;
};

/** Shown in place of a page when there is no valid login. */
export const LoginRequired = ({ what }: LoginRequiredProps) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-white">
    <div className="max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
      <h2 className="mb-3 text-2xl font-bold">Login required</h2>
      <p className="text-slate-300">You must log in before loading {what}.</p>
      <p className="mt-4 text-sm text-slate-400">Use the login button in the sidebar to sign in.</p>
    </div>
  </div>
);
