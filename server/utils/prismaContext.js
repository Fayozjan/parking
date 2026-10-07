import { prismaPublic } from "./prismaForTenant.js";

export const prismaContext = {
  run(_, callback) {
    return callback();
  },

  get() {
    return prismaPublic;
  },
};
