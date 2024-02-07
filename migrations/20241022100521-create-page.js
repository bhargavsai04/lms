'use strict';

/** 
 * This module defines a Sequelize migration for creating the 'Entries' table in the database.
 * @module Migration_Entries
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to create the 'Entries' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Create the 'Entries' table with columns for 'id', 'word', 'completed', 'createdAt', and 'updatedAt'
    await queryInterface.createTable('Entries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      word: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      completed: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  /**
   * Reverse the migration to drop the 'Entries' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Drop the 'Entries' table
    await queryInterface.dropTable('Entries');
  }
};