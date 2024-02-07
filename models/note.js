'use strict';

const { Model } = require('sequelize');

/** 
 * Represents a Note entity in the application.
 * @class
 * @extends Model
 */
module.exports = (sequelize, DataTypes) => {
  class Note extends Model {
    /**
     * Helper method for defining associations.
     * This method is automatically called by the `models/index` file.
     * @static
     * @param {object} models - The models object containing all defined models
     */
    static associate(models) {
      // Define associations between Note and other models
      Note.hasMany(models.Chapter, {
        foreignKey: 'NoteId'
      }); // A note has many chapters
      Note.belongsTo(models.User, {
        foreignKey: 'userId'
      }); // A note belongs to a user
    }
  }

  // Initialize Note model with attributes and options
  Note.init({
    heading: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Note',
  });

  return Note;
};
