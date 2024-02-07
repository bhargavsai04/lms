'use strict';

/** 
 * This module defines a Sequelize migration for adding the 'noteId' column to the 'Chapters' table.
 * @module Migration_AddNoteIdToChapters
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to add the 'noteId' column to the 'Chapters' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Add the 'noteId' column to the 'Chapters' table
    await queryInterface.addColumn('Chapters', 'noteId', {
      type: Sequelize.DataTypes.INTEGER
    });

    // Add foreign key constraint for the 'noteId' column referencing the 'id' column of the 'Notes' table
    await queryInterface.addConstraint('Chapters', {
      fields: ['noteId'],
      type: 'foreign key',
      references: {
        table: 'Notes',
        field: 'id'
      }
    });
  },

  /**
   * Reverse the migration to remove the 'noteId' column from the 'Chapters' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Remove the 'noteId' column from the 'Chapters' table
    await queryInterface.removeColumn('Chapters', 'noteId');
  }
};