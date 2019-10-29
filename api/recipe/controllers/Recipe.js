'use strict';

/**
 * Recipe.js controller
 *
 * @description: A set of functions called "actions" for managing `Recipe`.
 */

module.exports = {

  /**
   * Retrieve recipe records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.recipe.search(ctx.query);
    } else {
      return strapi.services.recipe.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a recipe record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.recipe.fetch(ctx.params);
  },

  /**
   * Count recipe records.
   *
   * @return {Number}
   */

  count: async (ctx, next, { populate } = {}) => {
    return strapi.services.recipe.count(ctx.query, populate);
  },

  /**
   * Create a/an recipe record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.recipe.add(ctx.request.body);
  },

  /**
   * Update a/an recipe record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.recipe.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an recipe record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.recipe.remove(ctx.params);
  }
};
