'use strict';

const { Model } = require('sequelize');

/** 
 * Represents a Page entity in the application.
 * @class
 * @extends Model
 */
module.exports = (sequelize, DataTypes) => {
  class Page extends Model {
    /**
     * Helper method for defining associations.
     * This method is automatically called by the `models/index` file.
     * @static
     * @param {object} models - The models object containing all defined models
     */
    static associate(models) {
      // Define associations between Page and other models
      Page.belongsTo(models.Chapter, {
        foreignKey: 'chapterId'
      }); // A page belongs to a chapter
    }
  }

  // Initialize Page model with attributes and options
  Page.init({
    word: DataTypes.TEXT,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Page',
  });

  return Page;
};
