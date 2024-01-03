'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reservations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId:{
        type: Sequelize.STRING
      },
      vehicleId:{
        type: Sequelize.INTEGER
      },
      pickUp: {
        type: Sequelize.STRING
      },
      dropOff: {
        type: Sequelize.STRING
      },
      passengers: {
        type: Sequelize.INTEGER
      },
      institution: {
        type: Sequelize.ENUM('personal', 'company', 'organization', 'others'),
        defaultValue: 'personal'
      },
      unit: {
        type: Sequelize.INTEGER
      },
      pickDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      dropDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'finished', 'cancelled'),
        defaultValue: 'pending'
      },
      totalPrice: {
        type: Sequelize.INTEGER
      },
      finishedAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: null
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Reservations');
  }
};