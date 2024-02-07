'use strict';

/** 
 * This module defines a Sequelize migration for creating the 'PageStats' table in the database.
 * @module Migration_CreatePageStatsTable
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to create the 'PageStats' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Create the 'PageStats' table with columns for 'id', 'studentId', 'courseId', 'chapterId', 'pageId', 'status', 'createdAt', and 'updatedAt'
    await queryInterface.createTable('PageStats', {
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
      chapterId: {
        type: Sequelize.INTEGER
      },
      pageId: {
        type: Sequelize.INTEGER
      },
      status: {
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
   * Reverse the migration to drop the 'PageStats' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Drop the 'PageStats' table
    await queryInterface.dropTable('PageStats');
  }
};