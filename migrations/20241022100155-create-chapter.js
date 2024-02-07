'use strict';

/** 
 * This module defines a Sequelize migration for creating the 'Sections' table in the database.
 * @module Migration_Sections
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to create the 'Sections' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Create the 'Sections' table with columns for 'id', 'title', 'description', 'createdAt', and 'updatedAt'
    await queryInterface.createTable('Sections', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
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
   * Reverse the migration to drop the 'Sections' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Drop the 'Sections' table
    await queryInterface.dropTable('Sections');
  }
};