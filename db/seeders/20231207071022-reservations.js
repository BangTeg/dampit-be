'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Reservations', [
      {
        userId: 'user-id-1',
        vehicleId: 1,
        pickUp: 'Pickup Location 1',
        dropOff: 'Drop-off Location 1',
        passengers: 5,
        institution: 'personal',
        unit: 1,
        pickDate: new Date('2023-12-15T08:00:00Z'),
        dropDate: new Date('2023-12-16T18:00:00Z'),
        status: 'approved',
        finishedAt: new Date('2023-12-16T18:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'user-id-2',
        vehicleId: 2,
        pickUp: 'Pickup Location 2',
        dropOff: 'Drop-off Location 2',
        passengers: 8,
        institution: 'company',
        unit: 2,
        pickDate: new Date('2023-12-20T10:00:00Z'),
        dropDate: new Date('2023-12-21T20:00:00Z'),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Reservations', null, {});
  }
};
