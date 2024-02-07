'use strict';

const { Model } = require('sequelize');

/** 
 * Represents a Chapter entity in the application.
 * @class
 * @extends Model
 */
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is automatically called by the `models/index` file.
     * @static
     * @param {object} models - The models object containing all defined models
     */
    static associate(models) {
      // Define associations
      Chapter.belongsTo(models.Note, {
        foreignKey: 'NoteId'
      });
      Chapter.hasMany(models.Page, {
        foreignKey: 'chapterId'
      });
    }
  }

  // Initialize Chapter model with attributes and options
  Chapter.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Chapter',
  });

  return Chapter;
};