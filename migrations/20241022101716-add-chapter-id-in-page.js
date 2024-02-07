'use strict';

/** 
 * This module defines a Sequelize migration for adding the 'chapterId' column to the 'Pages' table.
 * @module Migration_AddChapterIdToPages
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to add the 'chapterId' column to the 'Pages' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Add the 'chapterId' column to the 'Pages' table
    await queryInterface.addColumn('Pages', 'chapterId', {
      type: Sequelize.DataTypes.INTEGER
    });

    // Add foreign key constraint for the 'chapterId' column referencing the 'id' column of the 'Chapters' table
    await queryInterface.addConstraint('Pages', {
      fields: ['chapterId'],
      type: 'foreign key',
      references: {
        table: 'Chapters',
        field: 'id'
      }
    });
  },

  /**
   * Reverse the migration to remove the 'chapterId' column from the 'Pages' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Remove the 'chapterId' column from the 'Pages' table
    await queryInterface.removeColumn('Pages', 'chapterId');
  }
};