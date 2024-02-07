'use strict';

/** 
 * This module defines a Sequelize migration for adding the 'accountId' column to the 'Entries' table.
 * @module Migration_AddAccountIdToEntries
 * @type {import('sequelize-cli').Migration} 
 */

module.exports = {
  /**
   * Run the migration to add the 'accountId' column to the 'Entries' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async up(queryInterface, Sequelize) {
    // Add the 'accountId' column to the 'Entries' table
    await queryInterface.addColumn('Entries', 'accountId', {
      type: Sequelize.DataTypes.INTEGER
    });

    // Add foreign key constraint for the 'accountId' column referencing the 'id' column of the 'Accounts' table
    await queryInterface.addConstraint('Entries', {
      fields: ['accountId'],
      type: 'foreign key',
      references: {
        table: 'Accounts',
        field: 'id'
      }
    });
  },

  /**
   * Reverse the migration to remove the 'accountId' column from the 'Entries' table.
   * @param {import('sequelize').QueryInterface} queryInterface - The Sequelize Query Interface
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize library
   * @returns {Promise<void>} - A Promise that resolves when the migration is complete
   */
  async down(queryInterface, Sequelize) {
    // Remove the 'accountId' column from the 'Entries' table
    await queryInterface.removeColumn('Entries', 'accountId');
  }
};