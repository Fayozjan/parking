import { prismaContext } from "../../utils/prismaContext.js";

export const UserModel = {
  create: async (data) => {
    const prisma = prismaContext.get();
    return prisma.users.create({ data });
  },

  getList: async ({
    skip = 0,
    take = 50,
    where = {},
    orderBy = { id: "asc" },
  }) => {
    const prisma = prismaContext.get();

    return prisma.users.findMany({
      skip,
      take,
      orderBy,
      where,
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar: true,
        status: true,
      },
    });
  },

  count: async (where = {}) => {
    const prisma = prismaContext.get();
    return prisma.users.count({ where });
  },

  getById: async (id) => {
    const prisma = prismaContext.get();

    return prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar: true,
        telegram_id: true,
        status: true,
        can_view_open_parkings: true,
        access_from: true,
        access_until: true,
        menuAccess: {
          select: {
            menu_id: true,
            can_view: true,
            can_add: true,
            can_update: true,
            can_delete: true,
          },
        },
      },
    });
  },

  getWithPassword: async (id) => {
    const prisma = prismaContext.get();

    return prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
      },
    });
  },

  getInfo: async (id) => {
    const prisma = prismaContext.get();

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar: true,
      },
    });

    return {
      id: user?.id,
      first_name: user?.first_name,
      last_name: user?.last_name,
      photo: user?.avatar,
    };
  },

  updateById: async (userId, dataToUpdate, menuAccessOperations = []) => {
    const prisma = prismaContext.get();

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.users.update({
        where: { id: Number(userId) },
        data: dataToUpdate,
      });

      await tx.user_menu_access.deleteMany({
        where: { user_id: Number(userId) },
      });

      if (menuAccessOperations.length > 0) {
        await tx.user_menu_access.createMany({
          data: menuAccessOperations,
        });
      }

      return updatedUser;
    });
  },

  getMenuAccess: async (userId) => {
    const prisma = prismaContext.get();

    return prisma.user_menu_access.findMany({
      where: { user_id: Number(userId) },
    });
  },

  getAccess: async (id) => {
    const prisma = prismaContext.get();

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        settings: true,
        can_view_open_parkings: true,
        menuAccess: {
          where: { can_view: true },
          select: {
            can_view: true,
            can_add: true,
            can_update: true,
            can_delete: true,
            menu: {
              select: {
                id: true,
                name: true,
                path: true,
                parent_id: true,
                sort_order: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const menu = user.menuAccess.map(({ menu, ...permissions }) => ({
      ...menu,
      permissions: {
        view: permissions.can_view,
        add: permissions.can_add,
        update: permissions.can_update,
        delete: permissions.can_delete,
      },
    }));

    return {
      settings: user.settings,
      can_view_open_parkings: user.can_view_open_parkings,
      menu,
    };
  },

  updateProfile: async (userId, data) => {
    const prisma = prismaContext.get();

    return prisma.users.update({
      where: { id: userId },
      data,
    });
  },

  updateAvatar: async (userId, avatarPath) => {
    const prisma = prismaContext.get();

    return prisma.users.update({
      where: { id: userId },
      data: { avatar: avatarPath },
    });
  },
};
