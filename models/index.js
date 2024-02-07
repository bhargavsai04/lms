'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const processEnv = require('process');

const basename = path.basename(__filename);
const environment = processEnv.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[environment];
const database = {};

let sequelize;

// Establish Sequelize connection based on environment configuration
if (config.use_env_variable) {
  sequelize = new Sequelize(processEnv.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Read through each model file in the current directory and import it
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && // Exclude hidden files
      file !== basename && // Exclude the current file
      file.slice(-3) === '.js' && // Select JavaScript files
      !file.includes('.test.js') // Avoid loading test files
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    database[model.name] = model;
  });

// Associate models if associations are defined
Object.keys(database).forEach(modelName => {
  if (database[modelName].associate) {
    database[modelName].associate(database);
  }
});

// Export the Sequelize connection and models
database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;
