'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Vehicles', [
      {
        name: "Avanza",
        price: 600000,
        model: "All New Toyota Avanza",
        capacity: 7,
        include: "Driver, Fuel, Mineral Water",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 50000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Innova",
        price: 800000,
        model: "Toyota Innova Reborn",
        capacity: 7,
        include: "Driver, Fuel, Mineral Water",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 100000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Hiace Commuter",
        price: 1200000,
        model: "Toyota Hiace Commuter",
        capacity: 14,
        include: "Driver, Fuel, Mineral Water",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 100000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Hiace Premio",
        price: 1400000,
        model: "Toyota Hiace Premio",
        capacity: 14,
        include: "Driver, Fuel, Mineral Water",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 100000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Elf Long",
        price: 1200000,
        model: "Isuzu Elf Long",
        capacity: 19,
        include: "Driver, Fuel, Mineral Water",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 100000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Bus Medium",
        price: 2500000,
        model: "Isuzu NQR 71",
        capacity: 35,
        include: "Driver, Fuel, Navigator",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 150000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Big Bus",
        price: 3500000,
        model: "Adiputro Jetbus 3+",
        capacity: 50,
        include: "Driver, Fuel, Navigator",
        area: "In & Out of Solo City",
        parking: "Not Included",
        payment: "Cash/Transfer",
        overtime: 200000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Vehicles', null, {});
  }
};
