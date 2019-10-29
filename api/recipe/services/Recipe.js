/* global Recipe */
'use strict';

/**
 * Recipe.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

// Strapi utilities.
const utils = require('strapi-hook-bookshelf/lib/utils/');
const { convertRestQueryParams, buildQuery } = require('strapi-utils');


module.exports = {

  /**
   * Promise to fetch all recipes.
   *
   * @return {Promise}
   */

  fetchAll: (params, populate) => {
    // Select field to populate.
    const withRelated = populate || Recipe.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    const filters = convertRestQueryParams(params);

    return Recipe.query(buildQuery({ model: Recipe, filters }))
      .fetchAll({ withRelated })
      .then(data => data.toJSON());
  },

  /**
   * Promise to fetch a/an recipe.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    // Select field to populate.
    const populate = Recipe.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    return Recipe.forge(_.pick(params, 'id')).fetch({
      withRelated: populate
    });
  },

  /**
   * Promise to count a/an recipe.
   *
   * @return {Promise}
   */

  count: (params) => {
    // Convert `params` object to filters compatible with Bookshelf.
    const filters = convertRestQueryParams(params);

    return Recipe.query(buildQuery({ model: Recipe, filters: _.pick(filters, 'where') })).count();
  },

  /**
   * Promise to add a/an recipe.
   *
   * @return {Promise}
   */

  add: async (values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Recipe.associations.map(ast => ast.alias));
    const data = _.omit(values, Recipe.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Recipe.forge(data).save();

    // Create relational data and return the entry.
    return Recipe.updateRelations({ id: entry.id , values: relations });
  },

  /**
   * Promise to edit a/an recipe.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Recipe.associations.map(ast => ast.alias));
    const data = _.omit(values, Recipe.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Recipe.forge(params).save(data);

    // Create relational data and return the entry.
    return Recipe.updateRelations(Object.assign(params, { values: relations }));
  },

  /**
   * Promise to remove a/an recipe.
   *
   * @return {Promise}
   */

  remove: async (params) => {
    params.values = {};
    Recipe.associations.map(association => {
      switch (association.nature) {
        case 'oneWay':
        case 'oneToOne':
        case 'manyToOne':
        case 'oneToManyMorph':
          params.values[association.alias] = null;
          break;
        case 'oneToMany':
        case 'manyToMany':
        case 'manyToManyMorph':
          params.values[association.alias] = [];
          break;
        default:
      }
    });

    await Recipe.updateRelations(params);

    return Recipe.forge(params).destroy();
  },

  /**
   * Promise to search a/an recipe.
   *
   * @return {Promise}
   */

  search: async (params) => {
    // Convert `params` object to filters compatible with Bookshelf.
    const filters = strapi.utils.models.convertParams('recipe', params);
    // Select field to populate.
    const populate = Recipe.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    const associations = Recipe.associations.map(x => x.alias);
    const searchText = Object.keys(Recipe._attributes)
      .filter(attribute => attribute !== Recipe.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['string', 'text'].includes(Recipe._attributes[attribute].type));

    const searchInt = Object.keys(Recipe._attributes)
      .filter(attribute => attribute !== Recipe.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['integer', 'decimal', 'float'].includes(Recipe._attributes[attribute].type));

    const searchBool = Object.keys(Recipe._attributes)
      .filter(attribute => attribute !== Recipe.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['boolean'].includes(Recipe._attributes[attribute].type));

    const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

    return Recipe.query(qb => {
      if (!_.isNaN(_.toNumber(query))) {
        searchInt.forEach(attribute => {
          qb.orWhereRaw(`${attribute} = ${_.toNumber(query)}`);
        });
      }

      if (query === 'true' || query === 'false') {
        searchBool.forEach(attribute => {
          qb.orWhereRaw(`${attribute} = ${_.toNumber(query === 'true')}`);
        });
      }

      // Search in columns with text using index.
      switch (Recipe.client) {
        case 'mysql':
          qb.orWhereRaw(`MATCH(${searchText.join(',')}) AGAINST(? IN BOOLEAN MODE)`, `*${query}*`);
          break;
        case 'pg': {
          const searchQuery = searchText.map(attribute =>
            _.toLower(attribute) === attribute
              ? `to_tsvector(${attribute})`
              : `to_tsvector('${attribute}')`
          );

          qb.orWhereRaw(`${searchQuery.join(' || ')} @@ to_tsquery(?)`, query);
          break;
        }
      }

      if (filters.sort) {
        qb.orderBy(filters.sort.key, filters.sort.order);
      }

      if (filters.skip) {
        qb.offset(_.toNumber(filters.skip));
      }

      if (filters.limit) {
        qb.limit(_.toNumber(filters.limit));
      }
    }).fetchAll({
      withRelated: populate
    });
  }
};
