/** Set false to keep work across browser refreshes. Restart Vite after env changes. */
export const prototypeConfig = {
  resetOnRefresh: import.meta.env.VITE_RESET_ON_REFRESH !== undefined
    ? import.meta.env.VITE_RESET_ON_REFRESH !== "false"
    : true,
};
