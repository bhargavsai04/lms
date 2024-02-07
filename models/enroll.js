'use strict';

const { Model } = require('sequelize');

/** 
 * Represents an Enrollment entity in the application.
 * @class
 * @extends Model
 */
module.exports = (sequelize, DataTypes) => {
  class Enroll extends Model {
    /**
     * Helper method for defining associations.
     * This method is automatically called by the `models/index` file.
     * @static
     * @param {object} models - The models object containing all defined models
     */
    static associate(models) {
      // Define associations if needed in the future
    }
  }

  // Initialize Enroll model with attributes and options
  Enroll.init({
    studentId: DataTypes.INTEGER,
    courseId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Enroll',
  });

  return Enroll;
};