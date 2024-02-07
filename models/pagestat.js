'use strict';

const { Model } = require('sequelize');

/** 
 * Represents a PageStat entity in the application.
 * @class
 * @extends Model
 */
module.exports = (sequelize, DataTypes) => {
  class PageStat extends Model {
    /**
     * Helper method for defining associations.
     * This method is automatically called by the `models/index` file.
     * @static
     * @param {object} models - The models object containing all defined models
     */
    static associate(models) {
      // Define associations if needed in the future
    }

    /**
     * Sets the completion status of the PageStat instance.
     * @returns {Promise<void>} - A Promise that resolves once the status is updated
     */
    async setCompletionStatus() {
      // Set the completion status to true if it's currently false
      if (!this.status) {
        return this.update({ status: true });
      }
    }
  }

  // Initialize PageStat model with attributes and options
  PageStat.init({
    studentId: DataTypes.INTEGER,
    courseId: DataTypes.INTEGER,
    chapterId: DataTypes.INTEGER,
    pageId: DataTypes.INTEGER,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PageStat',
  });

  return PageStat;
};
