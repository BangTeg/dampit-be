'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservations extends Model {
    static associate(models) {
      Reservations.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'Users',
      });

      Reservations.belongsTo(models.Vehicles, {
        foreignKey: 'vehicleId',
        as: 'Vehicles',
      });
    }
  }

  Reservations.init({
    userId: DataTypes.STRING,
    vehicleId: DataTypes.INTEGER,
    pickUp: DataTypes.STRING,
    dropOff: DataTypes.STRING,
    passengers: DataTypes.INTEGER,
    institution: DataTypes.ENUM('personal', 'company', 'organization', 'others'),
    unit: DataTypes.INTEGER,
    pickDate: DataTypes.DATE,
    dropDate: DataTypes.DATE,
    status: DataTypes.ENUM('pending', 'approved', 'rejected', 'finished', 'cancelled'),
    totalPrice: DataTypes.INTEGER,
    finishedAt: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Reservations',
  });
  return Reservations;
};