export const tenantContext = {
  run(_, callback) {
    return callback();
  },

  get() {
    return null;
  },
};
