'use strict';

const { Model } = require('sequelize');

/** 
 * Represents a user entity in the application.
 * This model defines the structure and behavior of the user data stored in the database.
 * @class
 * @extends Model
 */
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is automatically called by the `models/index` file.
     * It establishes the relationship between the User and Note entities.
     * @static
     * @param {object} models - The models object containing all defined models
     */
    static associate(models) {
      // Define associations: A user can have many notes
      User.hasMany(models.Note, {
        foreignKey: 'userId'
      });
    }
  }

  // Initialize User model with attributes and options
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    roll: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
