'use strict';

/** 
 * This module defines a Sequelize migration for creating the 'Enrolls' table in the database.
 * @module Migration_CreateEnrollsTable
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to create the 'Enrolls' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Create the 'Enrolls' table with columns for 'id', 'studentId', 'courseId', 'createdAt', and 'updatedAt'
    await queryInterface.createTable('Enrolls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      studentId: {
        type: Sequelize.INTEGER
      },
      courseId: {
        type: Sequelize.INTEGER
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
   * Reverse the migration to drop the 'Enrolls' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Drop the 'Enrolls' table
    await queryInterface.dropTable('Enrolls');
  }
};