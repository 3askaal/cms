'use strict';

/**
 * order router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

const defaultRouter = createCoreRouter("api::order.order");

const customRouter = (defaultRouter, extraRoutes = []) => {
  return {
    get prefix() {
      return defaultRouter.prefix;
    },
    get routes() {
      return [...defaultRouter.routes, ...extraRoutes]
    },
  };
};

const extraRoutes = [
  {
    method: "GET",
    path: "/orders/confirm",
    handler: "api::order.order.confirm",
  }
];

module.exports = customRouter(defaultRouter, extraRoutes);
